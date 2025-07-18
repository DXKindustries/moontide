// src/services/tide/stationService.ts

import { cacheService } from '../cacheService';
import { getDistanceKm } from './geo';
import { debugLog } from '@/utils/debugLogger';

const NOAA_MDAPI_BASE = 'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi';

const STATION_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  zip?: string;
  city?: string;
  state?: string;
  userSelectedState?: string;
  distance?: number;
}

/* ---------- validation helpers ---------- */

const isValidStationId = (id: string | null | undefined) =>
  typeof id === 'string' && /^\d+$/.test(id.trim());

// Always fetch from backend API (dynamic, live, no mock data)
export async function getStationsForLocation(
  userInput: string
): Promise<Station[]> {
  const key = `stations:${userInput.toLowerCase()}`;

  if (!userInput || !userInput.trim()) {
    debugLog('Invalid station search term', { userInput });
    return [];
  }

  const cached = cacheService.get<Station[]>(key);
  if (cached) {
    debugLog('Station list cache hit', { userInput, count: cached.length });
    return cached;
  }

  const url = `${NOAA_MDAPI_BASE}/stations.json?type=tidepredictions&rows=10000&name=${encodeURIComponent(
    userInput,
  )}`;

  debugLog('Fetching stations for location', { userInput, url });
  const response = await fetch(url);
  if (!response.ok) throw new Error("Unable to fetch station list.");
  const data = await response.json();
  const stations = data.stations || [];
  debugLog('Stations fetched', { userInput, count: stations.length });
  cacheService.set(key, stations, STATION_CACHE_TTL);
  return stations;
}

export async function getStationsNearCoordinates(
  lat: number,
  lon: number,
  radiusKm = 100,
): Promise<Station[]> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error('Invalid coordinates for station search');
  }
  const key = `stations:${lat.toFixed(3)},${lon.toFixed(3)},${radiusKm}`;

  const cached = cacheService.get<Station[]>(key);
  if (cached) {
    debugLog('Nearby station cache hit', { lat, lon, count: cached.length });
    return cached;
  }

  const url = `${NOAA_MDAPI_BASE}/stations.json?type=tidepredictions&rows=10000&lat=${lat}&lon=${lon}&radius=${radiusKm}`;

  debugLog('Fetching stations near coordinates', { lat, lon, url });
  const response = await fetch(url);
  if (!response.ok) throw new Error('Unable to fetch station list.');
  const data = await response.json();
  const stations = data.stations || [];
  debugLog('Nearby stations fetched', { lat, lon, count: stations.length });
  cacheService.set(key, stations, STATION_CACHE_TTL);
  return stations;
}

export async function getStationById(id: string): Promise<Station | null> {
  if (!isValidStationId(id)) {
    debugLog('Invalid station ID lookup', { id });
    return null;
  }
  const key = `station:${id}`;
  const cached = cacheService.get<Station>(key);
  if (cached) {
    debugLog('Station cache hit', id);
    return cached;
  }

  const url = `${NOAA_MDAPI_BASE}/stations/${id}.json`;
  debugLog('Fetching station by ID', { id, url });
  try {
    const response = await fetch(url);
    console.log('🟡 Raw station fetch result:', response);
    if (response.status === 404) return null;
    let data;
    try {
      data = await response.json();
      console.log('🟢 Response JSON (if applicable):', data);
    } catch (jsonError) {
      console.error('Error parsing station response JSON:', jsonError);
      throw jsonError;
    }
    if (!response.ok) throw new Error('Unable to fetch station');
    const stationData = Array.isArray(data.stations) ? data.stations[0] : null;
    if (!stationData) {
      console.error('❌ No station found for this ID');
      return null;
    }
    console.log('Fetched station object:', stationData);
    const station: Station = {
      id: stationData.id,
      name: stationData.name,
      latitude: parseFloat(stationData.lat ?? stationData.latitude),
      longitude: parseFloat(stationData.lng ?? stationData.longitude),
      state: stationData.state,
    };
    debugLog('Station fetched', station);
    cacheService.set(key, station, STATION_CACHE_TTL);
    return station;
  } catch (error) {
    console.error('Error fetching station by ID:', error);
    throw error;
  }
}

/**
 * Sort NOAA station results with the most relevant first.
 * - Filters out stations that do not support the water_level product.
 * - Prefers reference stations (type "R").
 * - Optionally prioritizes stations whose name contains the resolved city.
 * - Sorts by distance from the provided lat/lon when available.
 */
export function sortStationsForDefault(
  stations: Station[],
  lat?: number,
  lon?: number,
  city?: string,
): Station[] {
  const cityLower = city?.toLowerCase() ?? '';

  const getDist = (s: Station) => {
    if (s.distance != null) return s.distance;
    if (
      lat != null &&
      lon != null &&
      typeof s.latitude === 'number' &&
      typeof s.longitude === 'number'
    ) {
      return getDistanceKm(lat, lon, s.latitude, s.longitude);
    }
    return Infinity;
  };

  return stations
    .filter((s) => {
      const products: string[] = (s as { products?: string[] }).products ?? [];
      return !products.length || products.includes('water_level');
    })
    .sort((a, b) => {
      // city match
      const aCity = cityLower && a.name.toLowerCase().includes(cityLower);
      const bCity = cityLower && b.name.toLowerCase().includes(cityLower);
      if (aCity !== bCity) return aCity ? -1 : 1;

      // type preference
      const aRef = (a as { type?: string }).type === 'R';
      const bRef = (b as { type?: string }).type === 'R';
      if (aRef !== bRef) return aRef ? -1 : 1;

      // distance
      return getDist(a) - getDist(b);
    });
}



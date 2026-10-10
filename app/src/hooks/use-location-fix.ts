import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { PickedPlace } from '@/lib/place-picker';

export type LocationFix =
  | { state: 'finding' }
  | { state: 'denied'; canAskAgain: boolean }
  | { state: 'failed' }
  | {
      state: 'found';
      /** gps = where the phone is; chosen = picked on the map */
      source: 'gps' | 'chosen';
      latitude: number;
      longitude: number;
      accuracy: number | null;
      address: string | null;
    };

/** "12th Main Rd, Indiranagar" from whatever parts the phone knows. */
export function describePlace(place: Location.LocationGeocodedAddress | undefined): string | null {
  if (!place) return null;
  const street = place.street ?? place.name;
  const area = place.district ?? place.subregion ?? place.city;
  const parts = [street, area].filter((p): p is string => Boolean(p));
  const unique = parts.filter((p, i) => parts.indexOf(p) === i);
  return unique.length ? unique.join(', ') : null;
}

/**
 * Where the problem is. Starts from where the person is standing; they can
 * instead choose another place on the map (choose()), or go back to their
 * own location (locateMe()).
 */
export function useLocationFix() {
  const [fix, setFix] = useState<LocationFix>({ state: 'finding' });
  /** Bumped on every locate/choose so a slow GPS answer can't overwrite a newer choice. */
  const generation = useRef(0);

  /** Asks the phone where it is. Callers show "finding" first (the initial state already does). */
  const lookUp = useCallback(async () => {
    const run = ++generation.current;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (run !== generation.current) return;
      if (!permission.granted) {
        setFix({ state: 'denied', canAskAgain: permission.canAskAgain });
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      if (run !== generation.current) return;
      const { latitude, longitude, accuracy } = position.coords;
      setFix({ state: 'found', source: 'gps', latitude, longitude, accuracy, address: null });
      // The street name is a nice-to-have; the pin is already enough to send.
      const places = await Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => []);
      if (run !== generation.current) return;
      setFix({ state: 'found', source: 'gps', latitude, longitude, accuracy, address: describePlace(places[0]) });
    } catch {
      if (run === generation.current) setFix({ state: 'failed' });
    }
  }, []);

  const locate = useCallback(async () => {
    setFix({ state: 'finding' });
    await lookUp();
  }, [lookUp]);

  const choose = useCallback((place: PickedPlace) => {
    generation.current++;
    setFix({ state: 'found', source: 'chosen', accuracy: null, ...place });
  }, []);

  useEffect(() => {
    void lookUp();
  }, [lookUp]);

  return { fix, retry: locate, locateMe: locate, choose };
}

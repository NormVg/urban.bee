/**
 * Hands a place chosen on the map screen back to the report screen.
 * The report screen registers a callback, opens /pick-location, and the map
 * screen delivers the result when the person taps "Use this place".
 */
export interface PickedPlace {
  latitude: number;
  longitude: number;
  address: string | null;
}

let waiting: ((place: PickedPlace) => void) | null = null;

export function awaitPickedPlace(onPicked: (place: PickedPlace) => void): void {
  waiting = onPicked;
}

export function deliverPickedPlace(place: PickedPlace): void {
  waiting?.(place);
  waiting = null;
}

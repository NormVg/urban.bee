/**
 * Tiny in-app signal: "the person's reports changed". The report screen fires
 * it after a successful send so the home list refreshes without a pull.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function onReportsChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function reportsChanged(): void {
  listeners.forEach((listener) => listener());
}

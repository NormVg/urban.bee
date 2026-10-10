import { Linking, Platform } from 'react-native';

/** Opens the phone's maps app with a pin at the given spot. */
export function openInMaps(latitude: number, longitude: number, label?: string | null): void {
  const name = encodeURIComponent(label || 'Reported problem');
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${name}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${name})`;
  void Linking.openURL(url);
}

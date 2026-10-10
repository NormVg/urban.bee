import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BigButton } from '@/components/ui/big-button';
import { Icon } from '@/components/ui/icon';
import { Brand, Radius, Shadow, Type } from '@/constants/theme';
import { describePlace } from '@/hooks/use-location-fix';
import { deliverPickedPlace } from '@/lib/place-picker';

/** Central Bengaluru, used when we don't know where the person is. */
const FALLBACK = { latitude: 12.9716, longitude: 77.5946 };
const ZOOM = { latitudeDelta: 0.006, longitudeDelta: 0.006 };

/**
 * Choose where the problem is: move the map under the pin, or search for a
 * street or area. The pin always marks the centre of the map.
 */
export default function PickLocationScreen() {
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const start = {
    latitude: Number(params.lat) || FALLBACK.latitude,
    longitude: Number(params.lng) || FALLBACK.longitude,
  };
  const map = useRef<MapView>(null);
  const [center, setCenter] = useState(start);
  const [resolved, setResolved] = useState<{ key: string; address: string | null } | null>(null);
  const centerKey = `${center.latitude.toFixed(5)},${center.longitude.toFixed(5)}`;
  const looking = resolved?.key !== centerKey;
  const address = looking ? null : resolved.address;
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const lookup = useRef(0);
  const lift = useSharedValue(0);

  /* Street name for the spot under the pin, after the map stops moving. */
  useEffect(() => {
    const run = ++lookup.current;
    const timer = setTimeout(async () => {
      const places = await Location.reverseGeocodeAsync(center).catch(() => []);
      if (run !== lookup.current) return;
      setResolved({ key: centerKey, address: describePlace(places[0]) });
    }, 350);
    return () => clearTimeout(timer);
  }, [center, centerKey]);

  const pinStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -lift.value }] }));

  async function search() {
    const text = query.trim();
    if (!text) return;
    Keyboard.dismiss();
    setSearching(true);
    setNotFound(false);
    try {
      const results = await Location.geocodeAsync(text);
      const first = results[0];
      if (!first) {
        setNotFound(true);
        return;
      }
      map.current?.animateToRegion({ latitude: first.latitude, longitude: first.longitude, ...ZOOM }, 450);
    } catch {
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  }

  function confirm() {
    deliverPickedPlace({ latitude: center.latitude, longitude: center.longitude, address });
    router.back();
  }

  return (
    <View style={styles.flex}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...start, ...ZOOM }}
        showsUserLocation
        showsPointsOfInterests={false}
        onRegionChange={() => {
          lift.value = withSpring(10, { damping: 18 });
        }}
        onRegionChangeComplete={(region: Region) => {
          lift.value = withSpring(0, { damping: 14 });
          setCenter({ latitude: region.latitude, longitude: region.longitude });
        }}
      />

      {/* The pin marks the map's centre; its tip sits exactly on the spot. */}
      <View pointerEvents="none" style={styles.pinLayer}>
        <Animated.View style={[styles.pin, pinStyle]}>
          <View style={styles.pinHead}>
            <Icon name="alert-triangle" size={20} color="#ffffff" />
          </View>
          <View style={styles.pinTail} />
        </Animated.View>
        <View style={styles.pinShadow} />
      </View>

      <SafeAreaView edges={['top']} style={styles.top} pointerEvents="box-none">
        <View style={styles.searchRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back without choosing"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.round, pressed && styles.roundPressed]}
          >
            <Icon name="x" size={24} color={Brand.ink} />
          </Pressable>
          <View style={styles.search}>
            <Icon name="search" size={20} color={Brand.ink3} />
            <TextInput
              accessibilityLabel="Search for a street or area"
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setNotFound(false);
              }}
              onSubmitEditing={search}
              placeholder="Search a street or area"
              placeholderTextColor={Brand.ink3}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {searching ? <ActivityIndicator color={Brand.blue} /> : null}
          </View>
        </View>
        {notFound ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>We couldn’t find that place. Try a nearby street name.</Text>
          </View>
        ) : null}
      </SafeAreaView>

      <Animated.View entering={FadeInUp.duration(320)} style={styles.sheet}>
        <SafeAreaView edges={['bottom']} style={styles.sheetInner}>
          <Text style={styles.hint}>Move the map so the pin is on the problem</Text>
          <View style={styles.addressRow}>
            <View style={styles.addressIcon}>
              <Icon name="map-pin" size={20} color={Brand.orange} />
            </View>
            <Text style={styles.address} numberOfLines={2}>
              {looking ? 'Finding the street…' : (address ?? 'This spot on the map')}
            </Text>
          </View>
          <BigButton label="Use this place" onPress={confirm} />
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const HEAD = 46;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.bg },
  pinLayer: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  /* Lift the pin by its own height so the tail's tip is the map centre. */
  pin: { alignItems: 'center', marginBottom: HEAD + 12 },
  pinHead: {
    width: HEAD,
    height: HEAD,
    borderRadius: HEAD / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.orange,
    borderWidth: 3,
    borderColor: '#ffffff',
    ...Shadow.raised,
  },
  pinTail: { width: 4, height: 14, marginTop: -2, borderRadius: 2, backgroundColor: Brand.orange },
  pinShadow: {
    position: 'absolute',
    width: 14,
    height: 6,
    borderRadius: 7,
    backgroundColor: 'rgba(36, 28, 19, 0.28)',
  },
  top: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 16, gap: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  round: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.surface2,
    ...Shadow.card,
  },
  roundPressed: { backgroundColor: Brand.surfaceInset },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 26,
    backgroundColor: Brand.surface2,
    ...Shadow.card,
  },
  searchInput: { flex: 1, fontSize: 18, color: Brand.ink },
  toast: {
    marginLeft: 62,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Brand.ink,
  },
  toastText: { ...Type.small, color: '#ffffff' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    backgroundColor: Brand.bg,
    ...Shadow.raised,
  },
  sheetInner: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12, gap: 14 },
  hint: { ...Type.small, color: Brand.ink2 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addressIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.orangeTint,
  },
  address: { ...Type.bodyStrong, color: Brand.ink, flex: 1 },
});

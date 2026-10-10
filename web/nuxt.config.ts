// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css', 'maplibre-gl/dist/maplibre-gl.css'],

  // Photos and voice notes live on disk in dev (web/.data/uploads). In
  // production server/plugins/media-storage.ts mounts S3 (or disk when
  // self-hosting), so callers never change.
  nitro: {
    devStorage: {
      uploads: { driver: 'fs', base: './.data/uploads' },
    },
    // Vercel: submitting a report runs the AI pipeline (often 10-20 s), so
    // give functions room beyond the default timeout.
    vercel: {
      functions: { maxDuration: 60 },
    },
  },

  // Flat component names: app/components/ui/UiButton.vue -> <UiButton />
  components: [{ path: '~/components', pathPrefix: false }],

  app: {
    head: {
      title: 'urban.bee',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'urban.bee — multi-department city operations dashboard',
        },
        { name: 'theme-color', content: '#e3d9c9' },
      ],
      link: [{ rel: 'icon', type: 'image/png', href: '/logo.png' }],
    },
  },
})

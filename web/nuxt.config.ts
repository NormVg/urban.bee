// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css', 'maplibre-gl/dist/maplibre-gl.css'],

  // Photos and voice notes live on disk in dev (web/.data/uploads).
  // Swap the driver for S3 / Neon object storage without touching callers.
  nitro: {
    storage: {
      uploads: { driver: 'fs', base: './.data/uploads' },
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

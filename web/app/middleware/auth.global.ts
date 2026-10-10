/**
 * Dashboard pages need an admin session. The splash page (/) and /login are
 * public; a signed-in admin visiting /login goes straight to the dashboard.
 */
const PUBLIC = new Set(['/', '/login'])

export default defineNuxtRouteMiddleware(async (to) => {
  const me = await useAdminSession().ensure()

  if (to.path === '/login') {
    if (me?.isAdmin) return navigateTo('/dashboard')
    return
  }
  if (PUBLIC.has(to.path)) return

  if (!me) return navigateTo({ path: '/login', query: { next: to.fullPath } })
  if (!me.isAdmin) return navigateTo({ path: '/login', query: { denied: '1' } })
})

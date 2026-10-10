<script setup lang="ts">
useHead({ title: 'urban.bee' })
</script>

<template>
  <main class="landing">
    <!-- Cyclone (swirl) dithering shader background; sand token color pre-mount -->
    <div class="landing__shader" aria-hidden="true">
      <ClientOnly>
        <Dithering
          color-back="#e3d9c9"
          color-front="#d7a984"
          shape="swirl"
          type="4x4"
          :size="4"
          :speed="0.35"
          :scale="2"
          :offset-x="0.75"
          :offset-y="-0.5"
        />
      </ClientOnly>
    </div>

    <!-- Calm zones: keep the wordmark and the logo off the animated texture -->
    <div class="landing__calm" aria-hidden="true" />

    <!-- Top bar: brand sigil (left) and dashboard entry (right), optically aligned -->
    <header class="landing__topbar">
      <div class="landing__sigil u-fade" aria-hidden="true">
        <BrandWordmark size="sm" mark-only />
      </div>

      <UiButton
        to="/dashboard"
        variant="secondary"
        size="sm"
        icon-right="arrowUpRight"
        class="landing__cta u-fade"
        :style="{ '--stagger': '80ms' }"
      >
        Dashboard
      </UiButton>
    </header>

    <NuxtLink
      to="/dashboard"
      class="landing__enter u-rise"
      aria-label="Enter the urban.bee dashboard"
    >
      <BrandWordmark size="lg" :show-mark="false" />
    </NuxtLink>
  </main>
</template>

<style scoped>
.landing {
  position: relative;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.landing__shader {
  position: absolute;
  inset: 0;
}

/* Radial sand fades over the shader: the animated texture never
   fights the wordmark (center) or the logo (top-left corner). */
.landing__calm {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      ellipse 52% 42% at 50% 50%,
      rgba(227, 217, 201, 0.96) 0%,
      rgba(227, 217, 201, 0.6) 46%,
      rgba(227, 217, 201, 0) 74%
    ),
    radial-gradient(
      circle 310px at 66px 66px,
      rgba(227, 217, 201, 0.94) 0%,
      rgba(227, 217, 201, 0) 72%
    );
}

.landing__topbar {
  position: absolute;
  top: clamp(20px, 3vw, 32px);
  left: clamp(20px, 3vw, 32px);
  right: clamp(20px, 3vw, 32px);
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* the bar spans the page; only its children take pointer events */
  pointer-events: none;
}

.landing__topbar > * {
  pointer-events: auto;
}

.landing__sigil {
  display: flex;
  opacity: 0.92;
}

.landing__enter {
  position: relative;
  z-index: 1;
  display: inline-flex;
  border-radius: var(--r-md);
  text-decoration: none;
}
</style>

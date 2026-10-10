<script setup lang="ts">
import { APP_SCREENS_BOTTOM, APP_SCREENS_TOP } from '~/constants/landing'

/*
 * Two rows of citizen-app screens drifting in opposite directions.
 * Each row renders its list twice and translates by -50% so the loop is
 * seamless. Pure CSS (transform only, GPU friendly); stops entirely under
 * reduced motion.
 */
const rows = [
  { id: 'top', screens: APP_SCREENS_TOP, reverse: false },
  { id: 'bottom', screens: APP_SCREENS_BOTTOM, reverse: true },
]
</script>

<template>
  <section class="screens" aria-labelledby="screens-title">
    <header class="screens__head">
      <p class="screens__kicker u-fade">The citizen app</p>
      <h2 id="screens-title" class="screens__title u-rise" :style="{ '--stagger': '60ms' }">
        One photo. The right team. Every step visible.
      </h2>
      <p class="screens__sub u-rise" :style="{ '--stagger': '120ms' }">
        Built so anyone can report a problem in under a minute and follow it until it is fixed.
      </p>
    </header>

    <div class="screens__rows">
      <div
        v-for="row in rows"
        :key="row.id"
        class="screens__row"
        :class="{ 'screens__row--reverse': row.reverse }"
      >
        <ul class="screens__track">
          <li
            v-for="(item, i) in [...row.screens, ...row.screens]"
            :key="`${row.id}-${i}`"
            class="screens__item"
            :aria-hidden="i >= row.screens.length"
          >
            <figure class="screens__phone">
              <img :src="item.src" :alt="item.label" loading="lazy" decoding="async" width="300" height="652" />
            </figure>
            <figcaption class="screens__label">{{ item.label }}</figcaption>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.screens {
  position: relative;
  padding: clamp(64px, 9vw, 112px) 0 clamp(72px, 10vw, 120px);
  background: var(--bg);
  border-top: 1px solid var(--line);
  overflow: hidden;
}

.screens__head {
  max-width: 640px;
  margin: 0 auto clamp(40px, 6vw, 64px);
  padding: 0 24px;
  text-align: center;
}

.screens__kicker {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--orange-strong);
}

.screens__title {
  margin: 0;
  font-size: clamp(26px, 3.6vw, 38px);
  line-height: 1.15;
  font-weight: 750;
  letter-spacing: -0.02em;
  color: var(--ink);
  text-wrap: balance;
}

.screens__sub {
  margin: 14px 0 0;
  font-size: 16px;
  line-height: 1.55;
  color: var(--ink-2);
  text-wrap: pretty;
}

.screens__rows {
  display: grid;
  gap: 28px;
  /* soft fade at both edges so screens slide in and out instead of being cut */
  mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
}

.screens__row {
  overflow: hidden;
}

.screens__track {
  display: flex;
  gap: 24px;
  width: max-content;
  margin: 0;
  padding: 0 12px;
  list-style: none;
  animation: screens-drift 70s linear infinite;
  will-change: transform;
}

.screens__row--reverse .screens__track {
  animation-duration: 82s;
  animation-direction: reverse;
}

.screens__item {
  flex: none;
  display: grid;
  gap: 12px;
  justify-items: center;
}

.screens__phone {
  width: clamp(160px, 16vw, 210px);
  margin: 0;
  padding: 6px;
  border-radius: 30px;
  background: var(--ink);
  box-shadow: var(--sh-2);
}

.screens__phone img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 24px;
}

.screens__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
}

@keyframes screens-drift {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .screens__track {
    animation: none;
  }
  .screens__row {
    overflow-x: auto;
  }
}
</style>

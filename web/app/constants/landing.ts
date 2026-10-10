/** Citizen app screens shown in the landing marquee (files live in public/screens). */
export interface AppScreen {
  src: string
  label: string
}

const screen = (file: string, label: string): AppScreen => ({ src: `/screens/${file}.jpg`, label })

export const APP_SCREENS_TOP: AppScreen[] = [
  screen('01-sign-in', 'Sign in'),
  screen('04-home-empty', 'Home'),
  screen('05-report', 'Report a problem'),
  screen('06-report-photo', 'Photo added'),
  screen('07-map-picker', 'Choose the place'),
  screen('08-report-note', 'Add a note'),
  screen('09-sending', 'Sending'),
  screen('10-thank-you', 'Sent to the right team'),
]

export const APP_SCREENS_BOTTOM: AppScreen[] = [
  screen('11-already-reported', 'Already reported'),
  screen('13-status-seen', 'The team has seen it'),
  screen('14-status-being-fixed', 'Work has started'),
  screen('15-status-fixed', 'Fixed'),
  screen('02-create-account', 'Create an account'),
  screen('03-form-validation', 'Helpful validation'),
  screen('12-send-error', 'Nothing is lost'),
  screen('16-sign-out', 'Sign out'),
]

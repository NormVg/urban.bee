/**
 * Type declarations for side-effect CSS imports (web output) and CSS
 * modules used by .web.tsx variants, so `tsc --noEmit` stays clean.
 */
declare module '*.css';
declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}

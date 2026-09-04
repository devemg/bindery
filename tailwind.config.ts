import type { Config } from 'tailwindcss';

/**
 * The design tokens from `docs/design-handoff/HANDOFF.md`, expressed once.
 *
 * Scales that the handoff *replaces* (colour, type, spacing, radii, shadows) are
 * written under `theme` rather than `theme.extend`, so a stray `p-4` or
 * `text-gray-500` from Tailwind's defaults cannot compile. Anything a component
 * needs should exist here as a semantic name — an arbitrary value in a component
 * (`bg-[#b4553f]`) is a bug, not a shortcut.
 *
 * Spacing keys are the literal pixel value (`gap-16` is 16px). The handoff's
 * 0.7x density scale, which the design-system component classes are built on,
 * lives alongside them as `d1`-`d8`.
 */

const accentTint = {
  /** rgba(180,85,63,.055) — drop-zone ground */
  faint: 'rgba(180, 85, 63, 0.055)',
  /** rgba(180,85,63,.09) — current-step halo */
  soft: 'rgba(180, 85, 63, 0.09)',
  /** rgba(180,85,63,.11) — drop-zone hover ground */
  mid: 'rgba(180, 85, 63, 0.11)',
  /** rgba(180,85,63,.16) — selected segment / current step */
  strong: 'rgba(180, 85, 63, 0.16)',
} as const;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',

      bg: '#17110e',
      surface: '#241b17',
      panel: '#201814',
      shell: '#2b211c',
      screen: '#0d0907',

      ink: {
        DEFAULT: '#ece1d0',
        muted: '#c4b3a1',
        dim: '#a89482',
        faint: '#8a7364',
        /** placeholder text and the inert half of a step label */
        ghost: '#55443b',
      },

      line: {
        DEFAULT: '#3d302a',
        dashed: '#55443b',
        divider: 'color-mix(in srgb, #ece1d0 16%, transparent)',
        dead: '#241c18',
      },

      neutral: {
        100: '#faf4ea',
        200: '#efe3d3',
        300: '#ddcbb6',
        400: '#c4b3a1',
        500: '#a89482',
        600: '#8a7364',
        700: '#6a5449',
        800: '#3d302a',
        900: '#241c18',
      },

      accent: {
        100: '#fdf1ec',
        200: '#f7dcd2',
        300: '#edc9bb',
        400: '#d99c86',
        500: '#b4553f',
        600: '#97432f',
        700: '#7a3527',
        800: '#4d2318',
        900: '#341a11',
        DEFAULT: '#b4553f',
      },

      'accent-2': {
        100: '#fdf1ec',
        200: '#f5ded4',
        300: '#e8c8b9',
        400: '#cfa08b',
        500: '#a8705a',
        600: '#8c5a46',
        700: '#6f4635',
        800: '#472c21',
        900: '#2f1d16',
        DEFAULT: '#a8705a',
      },

      tint: accentTint,
    },

    fontFamily: {
      heading: ['Spectral', 'Georgia', 'serif'],
      body: ['Inter', 'system-ui', 'sans-serif'],
    },

    fontSize: {
      plate: ['10px', { lineHeight: '1.4' }],
      tag: ['11px', { lineHeight: '1.4' }],
      'plate-lg': ['11.5px', { lineHeight: '1.4' }],
      prose: ['12.5px', { lineHeight: '1.6' }],
      sm: ['13px', { lineHeight: '1.5' }],
      md: ['13.5px', { lineHeight: '1.5' }],
      ui: ['14px', { lineHeight: '1.4' }],
      h2: ['21px', { lineHeight: '1.2' }],
      h1: ['34px', { lineHeight: '1.05' }],
    },

    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
    },

    letterSpacing: {
      title: '-0.01em',
      normal: '0',
      micro: '0.06em',
      note: '0.1em',
      caption: '0.12em',
      wide: '0.14em',
      plate: '0.18em',
    },

    lineHeight: {
      none: '1',
      title: '1.05',
      snug: '1.2',
      heading: '1.35',
      normal: '1.55',
      relaxed: '1.6',
      loose: '1.7',
    },

    borderRadius: {
      none: '0',
      screen: '2px',
      'screen-lg': '3px',
      sm: '4px',
      /** the .tag radius — calc(md * 0.75) in the design system */
      6: '6px',
      md: '8px',
      DEFAULT: '8px',
      shell: '12px',
      lg: '14px',
      full: '9999px',
    },

    borderWidth: {
      0: '0',
      DEFAULT: '1px',
      2: '2px',
    },

    boxShadow: {
      /** hairline edge only */
      sm: '0 0 0 1px #3d302a',
      /** hairline + ambient darkness — the device shell */
      md: '0 0 0 1px #55443b, 0 6px 18px rgba(0, 0, 0, 0.55)',
      lg: '0 0 0 1px #a89482, 0 16px 40px rgba(0, 0, 0, 0.65)',
      /** the halo around the current stepper circle */
      step: '0 0 0 4px rgba(180, 85, 63, 0.09)',
      none: 'none',
    },

    spacing: {
      0: '0px',
      px: '1px',
      /** the handoff's 0.7x density scale, used by the design-system classes */
      d1: '2.8px',
      d2: '5.6px',
      d3: '8.4px',
      d4: '11.2px',
      d6: '16.8px',
      d8: '22.4px',
      2: '2px',
      3: '3px',
      4: '4px',
      5: '5px',
      6: '6px',
      7: '7px',
      8: '8px',
      10: '10px',
      11: '11px',
      12: '12px',
      13: '13px',
      14: '14px',
      15: '15px',
      16: '16px',
      18: '18px',
      20: '20px',
      22: '22px',
      24: '24px',
      26: '26px',
      28: '28px',
      30: '30px',
      34: '34px',
      40: '40px',
      44: '44px',
      46: '46px',
      64: '64px',
      130: '130px',
      208: '208px',
      220: '220px',
      236: '236px',
      300: '300px',
      378: '378px',
    },

    maxWidth: {
      none: 'none',
      full: '100%',
      aside: '300px',
      record: '720px',
      page: '980px',
    },

    minWidth: {
      0: '0px',
      connector: '18px',
    },

    minHeight: {
      0: '0px',
      full: '100%',
      screen: '100vh',
      control: '36px',
      textarea: '90px',
    },

    gridTemplateColumns: {
      upload: '1.15fr 0.85fr',
      portrait: '1fr 300px',
      'portrait-solo': '1fr',
      bind: '1fr 220px',
      pair: '1fr 1fr',
    },

    backgroundImage: {
      /** the page ground */
      page: 'radial-gradient(120% 80% at 12% -10%, #241812 0%, #17110e 55%)',
      /** the .epub drop target, at rest and hovered */
      drop: `linear-gradient(160deg, ${accentTint.faint}, rgba(36, 27, 23, 0.5))`,
      'drop-hover': `linear-gradient(160deg, ${accentTint.mid}, rgba(36, 27, 23, 0.6))`,
      /** stepper connectors */
      'connector-done': 'linear-gradient(90deg, #7a3527, #7a3527)',
      'connector-next': 'linear-gradient(90deg, #3d302a, #241c18)',
    },

    transitionDuration: {
      DEFAULT: '140ms',
      0: '0ms',
    },

    transitionTimingFunction: {
      DEFAULT: 'ease',
    },

    outlineWidth: { 2: '2px' },
    outlineOffset: { 0: '0px', 2: '2px' },

    extend: {
      opacity: { 45: '0.45' },
      aspectRatio: { kindle: '1600 / 2560' },
      zIndex: { 1: '1' },
    },
  },
  plugins: [],
} satisfies Config;

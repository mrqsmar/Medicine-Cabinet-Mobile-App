/**
 * Accessibility-first design system for the Medicine Cabinet app.
 *
 * Design principles:
 *  - Minimum 18 px base font (WCAG / older-adult friendly)
 *  - High-contrast colour palette (≥ 4.5:1 ratio)
 *  - Minimum 48 × 48 dp tap targets (Material guidelines / Fitt's Law)
 */

// ── Palette ─────────────────────────────────────────────────────────

export const Colors = {
  // Primary
  primary: '#0B2545', // deep navy
  primaryLight: '#134074', // lighter navy for hover / pressed
  accent: '#006D6F', // dark teal

  // Semantic
  confirm: '#1B7A3D', // green — save / confirm actions
  cancel: '#C0392B', // red   — cancel / destructive actions
  warning: '#D4A017', // amber — low-refill warnings
  info: '#2471A3', // blue  — informational badges

  // Neutrals
  white: '#FFFFFF',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  border: '#D5D8DC',
  textPrimary: '#1C1C1E', // near-black for body text
  textSecondary: '#5A5A5E',
  textOnPrimary: '#FFFFFF',
  textOnConfirm: '#FFFFFF',
  textOnCancel: '#FFFFFF',

  // Misc
  disabled: '#B0B0B0',
  overlay: 'rgba(0, 0, 0, 0.45)',
} as const;

// ── Typography ──────────────────────────────────────────────────────

export const FontSizes = {
  xs: 14,
  sm: 16,
  base: 18, // minimum for older adults
  md: 20,
  lg: 24,
  xl: 28,
  xxl: 34,
  hero: 40,
} as const;

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ── Spacing ─────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ── Sizing / Tap Targets ────────────────────────────────────────────

export const HitSlop = { top: 12, bottom: 12, left: 12, right: 12 };

export const MinTapSize = 48; // dp — Material guideline minimum

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

// ── Shadows (light, elevation-1 style) ──────────────────────────────

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
} as const;

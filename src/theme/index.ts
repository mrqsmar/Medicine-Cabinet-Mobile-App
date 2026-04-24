/**
 * Accessibility-first design system for the Medicine Cabinet app.
 *
 * Design principles:
 *  - Minimum 18 px base font (WCAG / older-adult friendly)
 *  - High-contrast colour palette (≥ 4.5:1 ratio)
 *  - Minimum 48 × 48 dp tap targets (Material guidelines / Fitt's Law)
 */

import { colors, radii, type as typeScale } from './tokens';

// ── Palette ─────────────────────────────────────────────────────────

export const Colors = {
  // Primary
  primary: colors.navy,
  primaryLight: colors.navyDeep,
  accent: colors.sage,

  // Semantic
  confirm: colors.sage,       // green — save / confirm actions
  cancel: colors.coral,       // coral — cancel / destructive actions
  warning: colors.amber,      // amber — low-refill warnings
  info: colors.navy,          // navy  — informational badges

  // Neutrals
  white: colors.card,
  background: colors.canvas,
  surface: colors.card,
  border: colors.hairline,
  textPrimary: colors.ink,
  textSecondary: colors.inkSoft,
  textOnPrimary: colors.card,
  textOnConfirm: colors.card,
  textOnCancel: colors.card,

  // Misc
  disabled: colors.mute,
  overlay: 'rgba(0, 0, 0, 0.45)',
} as const;

// ── Typography ──────────────────────────────────────────────────────

export const FontSizes = {
  xs: typeScale.tiny,
  sm: typeScale.small,
  base: typeScale.body,     // minimum for older adults
  md: typeScale.bodyLg,
  lg: typeScale.h2,
  xl: typeScale.h1,
  xxl: typeScale.display,
  hero: typeScale.display,
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
  sm: radii.sm,
  md: radii.md,
  lg: radii.lg,
  pill: 999,
} as const;

// ── Shadows (light, elevation-1 style) ──────────────────────────────

export const Shadow = {
  sm: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
} as const;

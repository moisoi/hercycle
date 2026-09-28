export const typography = {
  fontFamily: "'Inter', 'SF Pro Rounded', 'Helvetica Neue', sans-serif",
  size: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '3rem',
  },
  weight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
  },
}

export const breakpoints = {
  sm: '@media (min-width: 640px)',
  md: '@media (min-width: 768px)',
  lg: '@media (min-width: 1024px)',
}

export const shadows = {
  soft: '0 4px 20px rgba(0, 0, 0, 0.08)',
  medium: '0 8px 30px rgba(0, 0, 0, 0.12)',
  focus: '0 0 0 3px rgba(107, 45, 93, 0.3)',
}

export const transitions = {
  fast: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  normal: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  slow: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  elastic: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
}
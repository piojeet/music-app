/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#f9ead2',
    tint: '#d9475f',
    background: '#080a0e',
    foreground: '#f8f3ea',
    card: '#12151b',
    cardForeground: '#f9ead2',
    primary: '#e7bd79',
    primaryForeground: '#17120b',
    secondary: '#171a21',
    secondaryForeground: '#f9ead2',
    muted: '#20242c',
    mutedForeground: '#9a9da4',
    accent: '#e7bd79',
    accentForeground: '#17120b',
    destructive: '#b96762',
    destructiveForeground: '#fff7ed',
    border: '#2a2d34',
    input: '#171a21',
    ink: '#080a0e',
    paper: '#f8f3ea',
    gold: '#e7bd79',
    rose: '#e7bd79',
    ember: '#84613b',
    glass: '#12151b',
    glassStrong: '#171a21',
    softGold: '#f2d49c',
  },
  radius: 18,
};

export default colors;

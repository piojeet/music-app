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
    background: '#0e0a09',
    foreground: '#f9ead2',
    card: '#1b1413',
    cardForeground: '#f9ead2',
    primary: '#d9475f',
    primaryForeground: '#fff7ed',
    secondary: '#251b18',
    secondaryForeground: '#f9ead2',
    muted: '#2b211d',
    mutedForeground: '#aa9782',
    accent: '#d6a24a',
    accentForeground: '#1a100c',
    destructive: '#e06455',
    destructiveForeground: '#fff7ed',
    border: '#3b2b25',
    input: '#2f231f',
    ink: '#090707',
    paper: '#f5e3c2',
    gold: '#d6a24a',
    rose: '#d9475f',
    ember: '#8b342e',
    glass: 'rgba(40, 27, 24, 0.76)',
    glassStrong: 'rgba(19, 13, 12, 0.94)',
    softGold: '#f2c875',
  },
  radius: 18,
};

export default colors;

/**
 * The module's own Tailwind build, compiled by `tailwind.scss`, as Docs' and Sheets' editors have theirs.
 *
 * In the Docs app the stylesheet loads before Proton's, so for a class both define Proton's rule wins.
 * `borderRadius` and `fontSize` replace Tailwind's scales with Proton's, so that the standalone app,
 * which has no Proton, renders those classes the same. Colours are arbitrary values of the tokens
 * (`bg-[--background-norm]`), as in the editors. For a border, write `border-[1px]`, not `border`:
 * Proton's `.border` also sets a colour, and would replace the module's `border-[--…]`.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: { relative: true, files: ['./**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}'] },
  theme: {
    extend: {
      // The Docs app's breakpoints.
      screens: {
        xsmall: { min: '450px' },
        // Proton's `>small`, as its compiled stylesheet has it: just above `narrow`, so the two never both apply.
        small: { min: '42.51em' },
        medium: { min: '910px' },
        large: { min: '1100px' },
        xlarge: { min: '1500px' },
        xxlarge: { min: '1900px' },
        // Proton's `<=small` (`useIsNarrow`), where its sidebar becomes a drawer. Tailwind's `max-[…]` variants
        // are unavailable with object screens.
        narrow: { max: '42.5em' },
      },
    },
    colors: { current: 'currentColor', transparent: 'transparent' },
    // Proton's `rounded-*`: the tokens are set in `HomepageStyleScope.css`.
    borderRadius: {
      none: '0',
      sm: 'var(--border-radius-sm)',
      DEFAULT: 'var(--border-radius-md)',
      lg: 'var(--border-radius-lg)',
      xl: 'var(--border-radius-xl)',
      xxl: 'var(--border-radius-xxl)',
      full: 'var(--border-radius-full)',
      50: '50%',
    },
    // Proton's `text-*`: sizes relative to the parent's, with no line height.
    fontSize: {
      '2xs': 'calc(9em / 14)',
      xs: 'calc(10em / 14)',
      sm: 'calc(12em / 14)',
      rg: '1em',
      lg: 'calc(16em / 14)',
      xl: 'calc(18em / 14)',
      '2xl': 'calc(20em / 14)',
      '3xl': 'calc(22em / 14)',
      '4xl': 'calc(24em / 14)',
      '5xl': 'calc(28em / 14)',
      '6xl': 'calc(32em / 14)',
    },
  },
}

# Writing component styles

[Design system](design-system.md) · [Utility classes and class ordering](utilities.md)

## Implementation order

When a Figma design-system component has a React equivalent, always use that component. For example, implement `Web/Card` with `Card` from `@proton/atoms/Card/Card`. Check the matching Storybook example for its supported variants and props before writing styles.

- Use component props for its standard behavior and appearance. Add utility classes for surrounding layout, slotted content or a required visual detail that the component does not expose. For example, use `Card` for the border and radius and supply a Lumo surface role if the design calls for a different fill.
- Compose the shared components when a feature combines several Figma components. Keep custom markup for a genuine gap in the component API or for distinct semantics, and document why the existing component could not be used.
- Use Proton utility classes for structure and spacing, and Lumo utility classes for visual styles. Prefer a complete role such as `lumo-body-medium` over separate size and weight classes.
- Keep custom SCSS for states, contextual rules or values that existing classes cannot express. Do not change the intended appearance just to eliminate SCSS.

For example, `className="lumo-card__title mb-2 lumo-title-medium"` keeps the component hook and reuses spacing and typography.

## Custom SCSS

Use namespaced BEM hooks and nest elements/modifiers under their block with `&__element` and `&--modifier`.

- Use semantic Lumo tokens for visual values and logical properties for directional layout. Keep static spacing, backgrounds, borders, corner radii, and foreground colors on the element with utilities when they fit. Pair the structural border utility with a semantic Lumo border color. Use a complete Lumo typography role for text. Keep selector-dependent rules such as a pseudoelement, responsive override, or generated markup in SCSS. Inside a CSS selector, use the matching `--lumo-space-*` step, for example `padding-block-start: var(--lumo-space-24)`. For a negative spacing step, use `calc(-1 * var(--lumo-space-6))` with the matching token. Keep exact off-scale values when layout or artwork requires them.
- Keep selectors local and specificity only as high as needed. Fix cascade conflicts rather than adding `!important` or duplicate classes.
- Style hover, pressed, selected, disabled and focus states without changing how controls respond. A token name containing `hover` or `focus` selects a value; it does not implement that state.
- Let content, padding and typography determine control size. Do not add minimum button dimensions or layout overrides unless a specific design requirement needs them.
- Check consumers before changing existing hooks. Keep unrelated migrations out of feature changes.

## Adapting Proton components

Import Proton components directly. [`lumo-proton-overrides.scss`](../styles/lumo-proton-overrides.scss) adapts their existing variable and class hooks without wrapping and re-exporting every component.

This preserves imports, props and shared behavior fixes, and keeps adaptation in one place. The tradeoff is coupling to Proton's selectors, specificity and state rules: upstream changes can cause visual regressions even when types and tests pass. Those regressions can affect focus visibility, contrast and usability, so they are not always cosmetic.

- Prefer existing variable hooks, then narrowly scoped component selectors. Reserve `html:root` for theme-variable precedence.
- Keep each control rule at the specificity of the Proton selector it replaces, and let source order decide. The document-wide scope sits in `:where()` and adds nothing, and conditions such as `:not(.unstyled)` or a parent class go in `:where()` too, so a utility class on the element (`py-0`, `radius-4`, `lumo-body-small`) overrides the rule as long as the utilities load after the adapter. Only go higher when Proton does, for example tabs and the switch, and name that Proton selector in a comment. The embedded `.lumo-ui` scope keeps its class because its stylesheet can load before Proton's.
- Leave display, alignment and surrounding layout to the component and usage-site utility classes. Override padding, typography or geometry only where the Lumo specification requires it.
- Keep portal content in the intended theme and adapter scope; it does not inherit the trigger's DOM ancestors.
- When no stable component hook exists, use supported styling props or utility classes at the usage site. Do not target a generic utility to imitate a component hook.
- Use a wrapper for repeated composition or different behavior, not visual adaptation alone. Request a shared hook when an override would depend on fragile DOM structure.

The adapter does not guarantee coverage of every Proton component or future variant. Keep legacy mappings internal; do not use them as the styling API for new Lumo components.

## Verification

Check affected components in light and dark, including focus, disabled and interactive states. Compare the rendered result with Figma; token usage alone does not establish a match. Record conflicting design specifications rather than silently inventing a value.

Check responsive layout, long text, RTL and zoom when affected, and inspect portal/theme isolation. Use Storybook's Buttons, Fields and Overlays pages to isolate a shared control's states, then verify the same control where it is used in the app. For breakpoints, record the CSS viewport width (`window.innerWidth`) because browser zoom can make it differ from the requested window size.

- Tab to controls and record the visible focus treatment. A text field has a focus border, while a toolbar button has its own focus ring.
- For drawers and overlays, check that the trigger remains clickable, a closed drawer is skipped by Tab, and Escape restores focus to the trigger. Check these again with any top-of-page announcement visible.
- The sidebar follows the Proton small breakpoint at 680 px. Check both sides of the threshold when editing the app shell.
- Use computed colors, geometry and the matching Figma state to resolve apparent differences. Keep signed-in and guest frames distinct and record where the available session limits the comparison.

Run the relevant formatter, Stylelint and package checks. Report which browser states remain unverified.

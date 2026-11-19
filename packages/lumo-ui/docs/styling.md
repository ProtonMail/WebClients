# Writing component styles

[Design system](design-system.md) · [Utility classes and class ordering](utilities.md)

## Implementation order

Reuse an existing component and its BEM hooks first, compose utility classes second, and write custom SCSS only for the remaining gap. A BEM hook does not require its own declarations.

- Check the component's implementation, props and package exports before adding a variant or wrapper.
- Use Proton utility classes for structure and spacing, and Lumo utility classes for visual styles. Prefer a complete role such as `lumo-body-medium` over separate size and weight classes.
- Keep custom SCSS for states, contextual rules or values that existing classes cannot express. Do not change the intended appearance just to eliminate SCSS.

For example, `className="lumo-card__title mb-2 lumo-title-medium"` keeps the component hook and reuses spacing and typography.

## Custom SCSS

Use namespaced BEM hooks and nest elements/modifiers under their block with `&__element` and `&--modifier`.

- Use semantic Lumo tokens for visual values and logical properties for directional layout.
- Keep selectors local and specificity only as high as needed. Fix cascade conflicts rather than adding `!important` or duplicate classes.
- Define hover, pressed, selected, disabled and focus behavior explicitly. A token name containing `hover` or `focus` selects a value; it does not implement that state.
- Let content, padding and typography determine control size. Do not add minimum button dimensions or layout overrides unless a specific design requirement needs them.
- Check consumers before changing existing hooks. Keep unrelated migrations out of feature changes.

## Adapting Proton components

Import Proton components directly. [`lumo-proton-overrides.scss`](../styles/lumo-proton-overrides.scss) adapts their existing variable and class hooks without wrapping and re-exporting every component.

This preserves imports, props and shared behavior fixes, and keeps adaptation in one place. The tradeoff is coupling to Proton's selectors, specificity and state rules: upstream changes can cause visual regressions even when types and tests pass. Those regressions can affect focus visibility, contrast and usability, so they are not always cosmetic.

- Prefer existing variable hooks, then narrowly scoped component selectors. Reserve `html:root` for theme-variable precedence; component rules add one class-level scope.
- Leave display, alignment and surrounding layout to the component and usage-site utility classes. Override padding, typography or geometry only where the Lumo specification requires it.
- Keep portal content in the intended theme and adapter scope; it does not inherit the trigger's DOM ancestors.
- When no stable component hook exists, use supported styling props or utility classes at the usage site. Do not target a generic utility to imitate a component hook.
- Use a wrapper for repeated composition or different behavior, not visual adaptation alone. Request a shared hook when an override would depend on fragile DOM structure.

The adapter does not guarantee coverage of every Proton component or future variant. Keep legacy mappings internal; do not use them as the styling API for new Lumo components.

## Verification

Check affected components in light and dark, including focus, disabled and interactive states. Compare the rendered result with Figma; token usage alone does not establish a match. Record conflicting design specifications rather than silently inventing a value.

Check responsive layout, long text, RTL and zoom when affected, and inspect portal/theme isolation. Run the relevant formatter, Stylelint and package checks. Report which browser states remain unverified.

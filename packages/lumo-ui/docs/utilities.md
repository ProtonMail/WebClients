# Utility classes

[Design system](design-system.md) · [Writing component styles](styling.md)

Prefer Lumo or Proton utility classes over equivalent token declarations in custom SCSS. Lumo visual utility classes use the `lumo-` prefix to avoid collisions with existing utility classes. Check the [implementation](../styles/_lumo-utilities.scss) for supported roles and values; do not assume Tailwind names or variants exist.

## Choosing classes

| Family | Purpose |
| --- | --- |
| `lumo-color-<role>` | Text and icons inheriting `currentColor` |
| `lumo-bg-<role>` | Background color |
| `lumo-border`, `lumo-border-mid`, `lumo-border-control[-<variant>]`, `lumo-border-artifact-{doc,code,web}` | Border color only; supply width/style separately |
| `lumo-{headline,title,body,label}-<size>` | Complete typography role |
| `lumo-font-mono` | Code font family; combine with a typography role |
| `lumo-radius-<size>` | Corner radius; does not clip children |
| `lumo-elevation-<level>` | Shadow; does not set background or stacking order |
| `lumo-opacity-<step>` | Whole-element opacity, including children |
| `lumo-icon-size-<size>` | Logical width and height; does not set SVG stroke or fill |
| `lumo-duration-<duration>`, `lumo-easing-<name>` | Motion timing; does not start an animation or select animated properties |

Use a translucent background role when only the background should fade. Duration classes respect reduced-motion preferences.

Reuse Proton spacing classes. The added `2.5` step extends `p-*`, `m-*` and `gap-*`, including directional forms such as `px-2.5` and `gap-x-2.5`. Existing suffixes retain their meanings.

Responsive and directional spacing depends on source order, so [`_lumo-spacing.scss`](../styles/_lumo-spacing.scss) regenerates the full Proton spacing set with `2.5` in place rather than appending only the new classes. Keep it in step with `packages/styles/scss/utilities/_spacing.scss`. The step comes only with the document-wide entry point; embedded `.lumo-ui` consumers do not get it.

Only this spacing extension provides responsive variants. Lumo visual classes do not provide responsive or `hover:` variants; define interaction states in component SCSS. A class such as `lumo-border-control-focus` applies a color immediately, not only on focus.

## Class-name ordering

Use this readability convention for literal class lists being added or edited. It does not control the CSS cascade or apply to JSX props and SCSS declarations.

| Order | Group                                                                                |
| ----- | ------------------------------------------------------------------------------------ |
| 1     | Component/BEM hooks, A–Z                                                             |
| 2     | Position, offsets, stacking                                                          |
| 3     | Display, direction, wrapping, grid, flex allocation, order, alignment, gap           |
| 4     | Sizing                                                                               |
| 5     | Margin                                                                               |
| 6     | Padding                                                                              |
| 7     | Overflow, scrolling, resize                                                          |
| 8     | Border width/style/color, radius, outline                                            |
| 9     | Typography role, intentional font overrides, text alignment/case/decoration/wrapping |
| 10    | Foreground, background, fill/stroke                                                  |
| 11    | Shadow, opacity, transforms, duration, easing, animation                             |
| 12    | Cursor, pointer events, selection, interaction and accessibility helpers             |
| 13    | Responsive passes: `sm:`, `md:`, `lg:`, `xl:`, `xxl:`; repeat the groups within each |

Within each group, use these property orders:

- Sizing: combined-size helpers, then `w-*`, `min-w-*`, `max-w-*`, `h-*`, `min-h-*`, `max-h-*`.
- Margin/padding: all sides, x-axis, y-axis, top, right, bottom, left. Keep negative and auto margins in their property family.
- Layout: display, direction, wrapping, grid tracks/placement, flex allocation, grow, shrink, order, items, justify, content, self, gap, gap-x, gap-y.
- Borders: broad declarations before side-specific ones, style before color, all-corner radius before corner-specific radius.

Otherwise sort A–Z by the full token, not by numeric value. For supported state variants, use base, hover, focus, focus-visible, focus-within, active, disabled, then other chains A–Z. Keep variant chains intact; do not invent unsupported variants.

Classify by behavior: `hidden` is display, `text-ellipsis` is typography, and `sr-only` is accessibility. A `lumo-*` utility is not a component hook. Preserve Proton's logical axes and RTL semantics.

Sort each string independently without changing `clsx` argument order, conditions or the caller's `className` position. Keep classes sharing a condition together. Do not add, remove or deduplicate classes as part of sorting; resolve conflicting styles separately. Preserve an unknown class's relative position until its definition is understood.

```tsx
<div className="lumo-card flex flex-column gap-2 w-full min-w-0 mb-4 p-2.5 border lumo-border-control lumo-radius-12 lumo-body-medium lumo-color-glyph lumo-bg-panel lumo-elevation-1" />
```

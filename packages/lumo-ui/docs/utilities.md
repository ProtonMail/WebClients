# Utility classes

[Design system](design-system.md) · [Writing component styles](styling.md)

Prefer Lumo or Proton utility classes over equivalent token declarations in custom SCSS. Border width, radius, opacity, and duration use the short `border-*`, `radius-*`, `opacity-*`, and `duration-*` names. Other Lumo visual utilities use the `lumo-` prefix. Check the [implementation](../styles/_lumo-utilities.scss) for supported roles and values; do not assume Tailwind names or variants exist.

Color utilities cover both [semantic and component tokens](design-system.md#token-tiers). The `lumo-color-artifact-*`, `lumo-bg-artifact-*` and `lumo-border-artifact-*` classes belong to the component tier and are reserved for their artifact/code uses.

## Choosing classes

| Family | Purpose |
| --- | --- |
| `border` | Proton's 1px border, themed through `--border-norm: var(--lumo-border)`. Keep the utility unchanged so color and style modifiers continue to work. |
| `lumo-color-<role>` | Text and icons inheriting `currentColor` |
| `lumo-bg-<role>` | Background color |
| `lumo-border`, `lumo-border-mid`, `lumo-border-control[-<variant>]`, `lumo-border-artifact-{doc,code,web}` | Border color only; supply width/style separately |
| `border-{1,1.5,2}` | Width only, from `--border-width-{1,1-5,2}`; pair with `border` or a side-specific structural border and a Lumo color. Loaded after Proton, including its `border-2`. |
| `lumo-{headline,title,body,label}-<size>` | Complete typography role |
| `lumo-font-mono` | Code font family; combine with a typography role |
| `radius-{4,8,12,16,28,full}` | Corner radius; does not clip children |
| `lumo-elevation-<level>` | Shadow; does not set background or stacking order |
| `opacity-{4,5,8,10,16,20,30,48}` | Whole-element opacity as a percentage, including children |
| `lumo-icon-size-<size>` | Logical width and height; does not set SVG stroke or fill |
| `duration-{100,150,200,300}`, `lumo-easing-<name>` | Motion timing; does not start an animation or select animated properties |

Choose a complete type role from the Figma Web scale. Use the closest role by purpose when a screen has no typography specification. In CSS, for example in a component selector, a pseudo-element or a responsive override, set the whole role with `font: var(--lumo-type-<role>)`. There are no separate size or weight tokens; each `--lumo-type-*` role holds its own values. For inline emphasis, use the role with the surrounding size and the heavier weight, such as `lumo-title-small` inside `lumo-body-medium` text. `font` resets the family, style and numeric variants, so declare `font-family: var(--lumo-font-mono)`, `font-variant-numeric` or `font-style` after it when needed. A component that sets its own typography needs no override in the caller.

Use a translucent background role when only the background should fade. Duration classes respect reduced-motion preferences.

Use `duration-*` for an element's timing and `var(--lumo-duration-*)` in component CSS. The transition scale is 100 ms for small state changes, 150 ms for hover and fades, 200 ms for menus and small moves, and 300 ms for panels and sheets. Spinners, loops, and feature animations can use their own timing.

Use a `lumo-easing-*` utility when an element shares one curve. Use `var(--lumo-easing-*)` in CSS for pseudo-elements, keyframes, or different curves by property or state. Use `standard` for changes and exits, `enter` for appearances, and `linear` for steady progress or spinners. Use `lottie` for feature-animation keyframes.

`opacity-30` uses the existing Proton utility and matches the Lumo 30% opacity token.

## Proton visual utilities to avoid

Use Proton for layout. For new or refreshed Lumo visuals, replace compatibility aliases and one-off visual overrides with the role that describes the element's purpose.

| Avoid in Lumo-owned visuals | Use instead |
| --- | --- |
| Foreground color aliases such as `text-grey`, `text-white`, `color-norm`, and `color-weak` | Use a semantic `lumo-color-*` role for text and icons. Use `lumo-color-glyph-mid` for readable secondary text, `lumo-color-control-brand-text` on brand-filled buttons, and `lumo-color-glyph-disabled` for disabled controls. Reserve `glyph-low` for approved uses such as placeholders. |
| `bg-norm`, `bg-weak`, `bg-strong`, `bg-primary`, `bg-white`, `bg-black` | Choose `lumo-bg-page`, `lumo-bg-panel[-elevated]`, a control fill or the inverse surface according to the design. Pair the background with its intended foreground role. |
| `border-weak`, `border-norm`, `border-strong` | Pair structural `border` or `border-bottom` with a Lumo border color. Use a control border for a control and a surface border for a container. |
| `rounded-*`, `shadow-*`, generic opacity and transition timing utilities | Use the corresponding Lumo radius, elevation, opacity, duration or easing role when implementing a specified design value. |
| Proton font size, font weight, and font family utilities, such as `text-xs`, `text-bold`, and `text-monospace` | Use a complete Lumo typography role. Add `lumo-font-mono` for code when needed. |
| `hover:bg-weak`, `hover:color-norm`, `interactive` stacked on an already styled Proton control | Let the adapter handle the shared control's states. For a custom control, set its hover, pressed and keyboard focus styles in component SCSS using Lumo roles. |

`font-medium`, `font-semibold`, `font-bold`, and `font-normal` have no CSS rules in Lumo. Use the weight built into the Lumo typography role, such as `lumo-label-medium` for a medium-weight control label or `lumo-body-small` for a short description.

Proton text behavior utilities remain appropriate. Use `text-ellipsis` for single-line truncation, `text-ellipsis-two-lines` for two-line truncation, and helpers such as `text-nowrap` and `text-left` for wrapping and alignment. Combine them with the appropriate Lumo typography role.

`flex`, `w-full`, `min-w-0`, spacing, overflow and accessibility helpers such as `sr-only` remain appropriate. In compact layouts, choose one owner for the gutters. For example, use a full-width composer inside a padded wrapper and check both inline edges at the actual CSS viewport width.

The sizing and spacing scales are independent. Proton has `p-10` and `gap-10`, but it does not emit `w-10` or `h-10`. Use `w-custom` and `h-custom` with their custom properties, or a component's sizing hook when the same geometry is reused.

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
<div className="lumo-card flex flex-column gap-2 w-full min-w-0 mb-4 p-2.5 border lumo-border-control radius-12 lumo-body-medium lumo-color-glyph lumo-bg-panel lumo-elevation-1" />
```

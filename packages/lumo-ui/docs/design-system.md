# Lumo design system

These documents define implementation rules for Lumo UI in the clients repository. Visual specifications belong in `lumo-design/foundations/`, `lumo-design/components/`, and `lumo-design/tokens/`; do not duplicate their value tables here.

Implemented design-token baseline: [`lumo-design@6d6b64b`](https://gitlab.protontech.ch/avijay/lumo-design/-/commit/6d6b64b0b506885512354b9f514375fdea751f04) (2026-11-20). This tracks token alignment, not full implementation of every component or UX specification. Update this reference when adopting a newer design revision.

Follow [Writing component styles](styling.md) when implementing UI and [Utility classes](utilities.md) when choosing and ordering classes.

## Choose the correct styling source

| Concern | Use |
| --- | --- |
| Display, layout, alignment and flex behavior | Proton utility classes |
| Relative sizing, positioning and overflow | Proton utility classes |
| Visibility, accessibility and text alignment/wrapping/truncation | Proton utility classes |
| Spacing | Proton utility classes, extended with the `2.5` step for 10px in the document-wide entry point |
| Colors, typography, border colors, radius, elevation, opacity, icon sizing and motion | Lumo utility classes and tokens |
| Shared control behavior | Existing Proton components and supported props |

Prefer utility classes over equivalent CSS-variable declarations in component SCSS. Use semantic or component Lumo tokens rather than raw colors or new consumers of Proton visual aliases such as `color-norm` and `--background-norm`.

## Token tiers

Follow the three tiers in `lumo-design/foundations/tokens.md`:

- **Primitives:** raw palettes and shared scales. UI colors do not consume palette primitives directly.
- **Semantic:** shared roles such as `--lumo-glyph` and `--lumo-panel`, used across components.
- **Component:** tokens for a component family's needs when no semantic role fits. The current tier contains 19 `--lumo-artifact-*` tokens for syntax, code surfaces, skeletons and creation tints. Their agreed colors are defined directly, rather than aliased to the primitive palette.

Both color tiers switch together in the light and dark theme stylesheets. Use artifact tokens only for their documented creation/code purpose; do not repurpose them as general UI colors. Storybook's Tokens page separates the tiers.

## Integration

The foundation is opt-in. Adding package exports does not activate it in an application.

- `@proton/lumo-ui/styles/lumo-design-system.scss` emits stable tokens, utility classes, the Proton spacing utilities with the `2.5` step, and document-wide Proton overrides. Import it once after the base Proton styles when enabling the refresh, so its spacing classes supersede the Proton copy.
- `@proton/lumo-ui/styles/themes/lumo-light.raw.scss` and `lumo-dark.raw.scss` emit theme-dependent tokens. Load the selected stylesheet through the consumer's theme provider, alongside its Proton theme.
- Embedded consumers must scope token declarations and the adapter to their opted-in UI, including portals. Do not import the document-wide entry point into an unrelated host application.
- Consumers load font files separately; token stylesheets do not load fonts.

## Token changes

Keep declarations in [`_lumo-tokens.scss`](../styles/_lumo-tokens.scss), aligned with the design specifications.

- Prefix variables with `--lumo-`, except color primitives and `--border-width-{1,1-5,2}`.
- Put theme-independent values in `stable` and theme-dependent values in both `light` and `dark`. Use rem for web typography.
- Edit the declarations directly; do not add a token generator or build-time dependency on the design repository.
- Keep Proton compatibility mappings inside the adapter. New Lumo-owned styles use Lumo roles; map by semantic purpose, not similar names.

Proton and Lumo spacing variables use different scales: `--space-4` is 16px, while `--lumo-space-4` is 4px. They are not interchangeable.

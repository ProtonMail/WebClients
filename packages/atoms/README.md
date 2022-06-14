The 'atoms' of the atomic-design component-architecture paradigm: https://bradfrost.com/blog/post/atomic-web-design/

The 'atoms' folder is home to proton brand-identity design-system specific reusable components which work independently of the applications they are used inside of.

Fit the description of base components / presentational components / dumb components / pure components.

Necessarily compositional.

Ideally functional, controlled (only props in events out) & stateful only to the containment of local ui-logic e.g. hover / focus states.

1 module per component. Should be kept 1 level deep. No grouping or nesting (other than for purely semantic co-location as in a component is so complex that its implementation details spans across multiple files).

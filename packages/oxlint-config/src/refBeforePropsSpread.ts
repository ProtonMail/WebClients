const message =
    "Put `ref` after the props spread. React 19 passes a caller's `ref` (even `null`) in the props, so a spread after the component's own `ref` replaces it.";

/** Only `rest`/`restProps` spreads, so hook results that may carry their own ref aren't reported; forwardRef render functions (two parameters) never get `ref` in their props. */
export const refBeforePropsSpreadSelectors = [
    {
        selector:
            'JSXOpeningElement > JSXAttribute[name.name="ref"] ~ JSXSpreadAttribute[argument.name=/^(rest|restProps)$/]:not(:function[params.length=2] *)',
        message,
    },
];

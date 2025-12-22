/** Checks if an element creates a containing block for absolutely positioned
 * descendants. This function provides a minimal version of containing block
 * detection. check MDN documentation for missing cases in case they become relevant
 * See: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Display/Containing_block#identifying_the_containing_block */
export const isContainingBlock = (el: HTMLElement, styles?: CSSStyleDeclaration): boolean => {
    const computed = styles ?? getComputedStyle(el);

    return Boolean(
        (computed.position && computed.position !== 'static') ||
        (computed.transform && computed.transform !== 'none') ||
        (computed.filter && computed.filter !== 'none') ||
        (computed.perspective && computed.perspective !== 'none') ||
        (computed.backdropFilter && computed.backdropFilter !== 'none')
    );
};

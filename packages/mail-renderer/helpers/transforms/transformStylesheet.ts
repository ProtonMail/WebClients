/**
 * Some emails from ex: tripit contains a position absolute on the container
 * => hack to prevent margin on android/ios
 * @{@link https://twitter.com/HTeuMeuLeu/status/852110032045035520}
 * Gmail changes the dom too.
 */
const replaceAbsolutePositionOnFirstElement = (document: Element) => {
    const firstElement = document.firstElementChild as HTMLElement | null;

    if (firstElement && /absolute/.test(firstElement.style.position)) {
        firstElement.style.position = 'inherit';
    }
};

/**
 * Because fixed position breaks some email layout it's safer to
 * replace it with inherit.
 *
 * Replace `fixed` position by `inherit` in the content
 * of every style tags.
 *
 * https://www.caniemail.com/search/?s=fixed
 */
const replaceFixedPositionWithInherit = (styleTag: HTMLStyleElement) => {
    const fixedPositionRegex = /position[\s]*\:[\s]*fixed/gim;
    const styleContent = styleTag.textContent;

    if (styleContent && fixedPositionRegex.test(styleContent)) {
        styleTag.textContent = styleContent.replaceAll(fixedPositionRegex, 'position: inherit !important');
    }
};

/**
 * Height-dependent media queries interfere with iframe height size calculations
 */
const replaceHeightDependentMediaQueries = (styleTag: HTMLStyleElement) => {
    const isSupportedRule = (rule: CSSRule): rule is CSSMediaRule | CSSContainerRule =>
        rule.constructor.name === 'CSSMediaRule' || rule.constructor.name === 'CSSContainerRule';

    const { sheet } = styleTag;

    if (!sheet) {
        return;
    }

    /**
     * Iterate through all *top-level* CSSMediaRules looking for any that match
     * on height, while simultaneously re-constructing the textContent from any
     * other (valid) rules.
     *
     * If a height-based CSSMediaRule is found, flag the textContent to be
     * replaced with the reconstructed version, otherwise noop.
     *
     * At the moment this does not support nested CSS, as the test suite chokes
     * when parsing those. Nested CSS is still too new and too niche for email
     * clients to risk an implementation not covered tests.
     */
    const result = [...sheet.cssRules].reduce(
        (acc: { replaceTextContent: boolean; textContent: string }, rule) => {
            if (isSupportedRule(rule) && rule.conditionText.includes('height')) {
                return {
                    replaceTextContent: true,
                    textContent: acc.textContent,
                };
            }

            return {
                replaceTextContent: acc.replaceTextContent,
                textContent: acc.textContent + rule.cssText + '\n',
            };
        },
        { replaceTextContent: false, textContent: '' }
    );

    if (result.replaceTextContent) {
        styleTag.textContent = result.textContent;
    }
};

export const transformStylesheet = (document: Element) => {
    replaceAbsolutePositionOnFirstElement(document);

    const styleTags = document.querySelectorAll('style');
    styleTags.forEach((styleTag) => {
        replaceFixedPositionWithInherit(styleTag);
        replaceHeightDependentMediaQueries(styleTag);
    });
};

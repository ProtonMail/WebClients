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
const replaceFixedPositionWithInherit = (document: Element) => {
    const styleTags = document.querySelectorAll('style');
    const fixedPositionRegex = /position[\s]*\:[\s]*fixed/gim;

    styleTags.forEach((styleTag) => {
        const styleContent = styleTag.textContent;

        if (styleContent && fixedPositionRegex.test(styleContent)) {
            styleTag.textContent = styleContent.replaceAll(fixedPositionRegex, 'position: inherit !important');
        }
    });
};

export const transformStylesheet = (document: Element) => {
    replaceAbsolutePositionOnFirstElement(document);
    replaceFixedPositionWithInherit(document);
};

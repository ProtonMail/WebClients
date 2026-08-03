export const setEmbeddedAttr = (cid: string, cloc: string, element: Element) => {
    if (cid) {
        element.setAttribute('data-embedded-img', `cid:${cid}`);
    } else if (cloc) {
        element.setAttribute('data-embedded-img', `cloc:${cloc}`);
    }
};

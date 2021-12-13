export const locateHead = (inputDocument: Element | Document | undefined): string | undefined => {
    if (!inputDocument) {
        return undefined;
    }

    const head = inputDocument.querySelector('head');

    return head?.innerHTML;
};

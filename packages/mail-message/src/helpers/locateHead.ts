/** TODO: Import related test from proton-mail app package */
export const locateHead = (inputDocument: Element | Document | undefined): string | undefined => {
    if (!inputDocument) {
        return undefined;
    }

    const head = inputDocument.querySelector('head');

    return head?.innerHTML;
};

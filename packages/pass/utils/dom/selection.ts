import type { MaybeNull } from '@proton/pass/types';

export const SelectionManager = (() => {
    let selection: MaybeNull<Selection> = null;

    const onSelectionChange = () => {
        selection = window.getSelection();
    };

    document.addEventListener('selectionchange', onSelectionChange);

    const hasAny = () => selection !== null && selection.toString().length > 0;

    const hasChildOf = (el: Element) =>
        hasAny() && selection !== null && (el.contains(selection.anchorNode) || el.contains(selection.focusNode));

    const disconnect = () => document.removeEventListener('selectionchange', onSelectionChange);

    return {
        hasAny,
        hasChildOf,
        disconnect,
    };
})();

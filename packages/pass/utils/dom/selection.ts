export const SelectionManager = (() => {
    const hasChildOf = (el: Element) => {
        const selection = window.getSelection();
        if (selection === null || selection.toString().length === 0) return false;

        const { anchorNode, focusNode } = selection;
        return selection.containsNode(el) || el.contains(anchorNode) || el.contains(focusNode);
    };

    return {
        hasChildOf,
    };
})();

export const SelectionManager = (() => {
    let hasSelection = false;

    const onSelectionChange = () => {
        const selection = window.getSelection();
        hasSelection = selection !== null && selection.toString().length > 0;
    };

    document.addEventListener('selectionchange', onSelectionChange);

    return {
        get selection() {
            return hasSelection;
        },

        disconnect: () => document.removeEventListener('selectionchange', onSelectionChange),
    };
})();

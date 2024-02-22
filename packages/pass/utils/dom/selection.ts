/** Checks if there is an active text selection in the document or in an input field.
 * This function is a workaround for a limitation in Firefox, which does not properly
 * implement the getSelection() method for input and textarea elements. Until this is
 * fixed in Firefox, this function provides a reliable way to check for text selection
 * across all major browsers */
export const hasSelection = () => {
    const selection = getSelection();

    const fieldSelected =
        document.activeElement !== document.body
            ? [...document.activeElement!.querySelectorAll<HTMLTextAreaElement | HTMLInputElement>('textarea')].some(
                  ({ selectionStart, selectionEnd }) => Math.abs((selectionStart ?? 0) - (selectionEnd ?? 0)) > 0
              )
            : false;

    return fieldSelected || selection?.toString() !== '';
};

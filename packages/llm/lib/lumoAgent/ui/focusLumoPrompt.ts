const LUMO_PROMPT_SELECTOR = '#drawer-app-lumo [data-lumo-prompt]';

export const focusLumoPrompt = () => {
    const textarea = document.querySelector<HTMLTextAreaElement>(LUMO_PROMPT_SELECTOR);
    if (!textarea) {
        return;
    }
    textarea.focus();
    // A textarea mounted with a value starts with its caret at 0, and focus() keeps it there
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
};

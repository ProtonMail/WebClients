const LUMO_PROMPT_SELECTOR = '#drawer-app-lumo [data-lumo-prompt]';

export const focusLumoPrompt = () => {
    const textarea = document.querySelector<HTMLElement>(LUMO_PROMPT_SELECTOR);
    textarea?.focus();
};

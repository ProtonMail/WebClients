const HTML_TAGS_TO_IGNORE = ['input', 'select', 'textarea'];

export const isTargetEditable = (e: KeyboardEvent) => {
    const { tagName, isContentEditable } = e.target as HTMLElement;

    return HTML_TAGS_TO_IGNORE.includes(tagName.toLowerCase()) || isContentEditable;
};

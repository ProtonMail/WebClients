export const checkForInsideClick = (event: React.MouseEvent | React.FocusEvent, targetClassName: string) => {
    const element = event.relatedTarget as HTMLElement | null;
    return element?.closest(`.${targetClassName}`) !== null;
};

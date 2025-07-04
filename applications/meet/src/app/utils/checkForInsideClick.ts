export const checkForInsideClick = (event: React.MouseEvent | React.FocusEvent, targetClassName: string) => {
    let el = event.relatedTarget as HTMLElement | null;
    let found = false;
    while (el) {
        if (el.classList && el.classList.contains(targetClassName)) {
            found = true;
            break;
        }
        el = el.parentElement;
    }

    return found;
};

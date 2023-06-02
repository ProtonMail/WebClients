export default function textToClipboard(text = '', target = document.body) {
    const oldActiveElement = document.activeElement as HTMLElement;
    if (navigator.clipboard) {
        void navigator.clipboard.writeText(text);
    } else {
        const dummy = document.createElement('textarea');
        target.appendChild(dummy);
        dummy.value = text;
        dummy.select();
        document.execCommand('copy');
        target.removeChild(dummy);
    }
    oldActiveElement?.focus?.();
}

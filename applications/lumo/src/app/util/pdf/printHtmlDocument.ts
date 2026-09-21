/** Opens a standalone HTML document in a new window and triggers the browser print dialog. */
export function printHtmlDocument(html: string): boolean {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        return false;
    }

    printWindow.opener = null;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    const triggerPrint = () => {
        printWindow.print();
    };

    if (printWindow.document.readyState === 'complete') {
        triggerPrint();
    } else {
        printWindow.addEventListener('load', triggerPrint, { once: true });
    }

    return true;
}

import { INVOICES_PER_PAGE, INVOICE_OWNER } from '../../constants';

/* @ngInject */
function invoiceModel(
    networkActivityTracker,
    Payment,
    downloadFile,
    customizeInvoiceModal,
    gettextCatalog,
    translator
) {
    const I18N = translator(() => ({
        title: gettextCatalog.getString('Invoice', null, 'Title invoice PDF')
    }));

    const load = ({ Page = 0, Owner = INVOICE_OWNER.USER } = {}) => {
        return networkActivityTracker.track(Payment.invoices({ Owner, Page, PageSize: INVOICES_PER_PAGE }));
    };

    const download = async (ID) => {
        const buffer = await networkActivityTracker.track(Payment.invoice(ID));
        const filename = `ProtonMail ${I18N.title} ${ID}.pdf`;
        const blob = new Blob([buffer], { type: 'application/pdf' });
        downloadFile(blob, filename);
    };

    const customize = () => customizeInvoiceModal.activate();

    return {
        load,
        customize,
        download
    };
}

export default invoiceModel;

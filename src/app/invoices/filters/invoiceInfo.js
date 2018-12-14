import { INVOICE_TYPE, INVOICE_STATE } from '../../constants';

/* @ngInject */
function invoiceInfoFilter(gettextCatalog) {
    const I18N = {
        type: {
            [INVOICE_TYPE.OTHER]: gettextCatalog.getString('Other', null, 'Invoice type display as badge'),
            [INVOICE_TYPE.SUBSCRIPTION]: gettextCatalog.getString(
                'Subscription',
                null,
                'Invoice type display as badge'
            ),
            [INVOICE_TYPE.CANCELLATION]: gettextCatalog.getString(
                'Cancellation',
                null,
                'Invoice type display as badge'
            ),
            [INVOICE_TYPE.CREDIT]: gettextCatalog.getString('Credit', null, 'Invoice type display as badge'),
            [INVOICE_TYPE.DONATION]: gettextCatalog.getString('Donation', null, 'Invoice type display as badge')
        },
        state: {
            [INVOICE_STATE.UNPAID]: gettextCatalog.getString('Unpaid', null, 'Invoice status display as badge'),
            [INVOICE_STATE.PAID]: gettextCatalog.getString('Paid', null, 'Invoice status display as badge'),
            [INVOICE_STATE.VOID]: gettextCatalog.getString('Void', null, 'Invoice status display as badge'),
            [INVOICE_STATE.BILLED]: gettextCatalog.getString('Billed', null, 'Invoice status display as badge')
        }
    };

    return (invoice = {}, mode) => {
        const key = mode === 'type' ? 'Type' : 'State';
        return (I18N[mode] || {})[invoice[key]] || '';
    };
}
export default invoiceInfoFilter;

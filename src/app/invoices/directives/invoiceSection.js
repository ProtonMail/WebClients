import { UNPAID_STATE, INVOICE_OWNER, INVOICES_PER_PAGE } from '../../constants';

/* @ngInject */
function invoiceSection(authentication, dispatchers, invoiceModel) {
    const init = async ({ Page = 0, Owner = INVOICE_OWNER.USER } = {}) => {
        const { Invoices, Total } = await invoiceModel.load({ Page, Owner });
        return {
            owner: Owner,
            loaded: true,
            list: Invoices,
            total: Total,
            page: Page + 1,
            perPage: INVOICES_PER_PAGE
        };
    };

    const getUserInfo = (key) => {
        const data = {
            subscribed: authentication.user.Subscribed,
            delinquent: authentication.user.Delinquent >= UNPAID_STATE.DELINQUENT,
            role: authentication.user.Role
        };
        return data[key];
    };

    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/invoices/invoiceSection.tpl.html'),
        async link(scope, el) {
            const { dispatcher } = dispatchers(['paginatorScope']);
            const model = {};

            const render = async (Page, Owner) => {
                const data = await init({ Page, Owner });
                Object.assign(model, data);
                scope.$applyAsync(() => {
                    scope.model = model;
                });
            };

            scope.getUserInfo = getUserInfo;
            scope.changePage = async (page) => {
                await render(page - 1, model.owner);
                dispatcher.paginatorScope('invoices', { page });
            };

            const onClick = ({ target }) => {
                const action = target.getAttribute('data-action');

                if (!action) {
                    return;
                }

                action === 'download' && invoiceModel.download(target.getAttribute('data-action-arg'));
                action === 'customize' && invoiceModel.customize();

                const key = action.toUpperCase();
                if (typeof INVOICE_OWNER[key] !== 'undefined') {
                    render(0, INVOICE_OWNER[key]);
                }
            };
            render();

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default invoiceSection;

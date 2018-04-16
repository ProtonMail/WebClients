/* @ngInject */
function donateBtn(gettextCatalog, notification, donateModal, paymentModel) {
    const I18N = {
        donation: gettextCatalog.getString('Donate', null, 'Title'),
        topUp: gettextCatalog.getString('Add credits', null, 'Title'),
        notAvailable: gettextCatalog.getString('Donations are currently not available, please try again later', null, 'Info')
    };

    return {
        replace: true,
        template: `<button class="sidebarApp-link donateBtn-container"><div>
                <i class="fa fa-heart-o sidebarApp-icon donateBtn-icon"></i>
                <span class="donateBtn-title">Donate</span></div>
            </button>`,
        link(scope, el, { item = 'donation' }) {
            const $title = el[0].querySelector('.donateBtn-title');
            $title.textContent = I18N[item];

            const onClick = () => {
                if (!paymentModel.canPay()) {
                    return notification.info(I18N.notAvailable);
                }

                donateModal.activate({
                    params: {
                        type: item,
                        close: donateModal.deactivate
                    }
                });
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default donateBtn;

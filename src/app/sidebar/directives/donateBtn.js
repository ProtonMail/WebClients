angular.module('proton.sidebar')
    .directive('donateBtn', (gettextCatalog, Payment, donateModal, networkActivityTracker) => {

        const LABEL = gettextCatalog.getString('Donate', null, 'Title');

        return {
            replace: true,
            template: `<button class="sidebarApp-link donateBtn-container"><div>
                <i class="fa fa-heart-o sidebarApp-icon donateBtn-icon"></i>
                <span class="donateBtn-title">Donate</span></div>
            </button>`,
            link(scope, el) {
                const $title = el[0].querySelector('.donateBtn-title');
                $title.textContent = LABEL;

                const onClick = () => {
                    const promise = Payment.methods()
                        .then(({ data = {} } = {}) => {
                            if (data.Code === 1000) {
                                donateModal.activate({
                                    params: {
                                        methods: data.PaymentMethods,
                                        close() {
                                            donateModal.deactivate();
                                        }
                                    }
                                });
                            }
                        });
                    networkActivityTracker.track(promise);
                };

                el.on('click', onClick);

                scope.$on('$destroy', () => {
                    el.off('click', onClick);
                });
            }
        };
    });

angular.module('proton.ui')
    .directive('saleLink', (networkActivityTracker, Payment, saleModal) => {
        function onClick() {
            const promise = Payment.methods()
            .then((result = {}) => {
                const { data = {} } = result;
                if (data.Code === 1000) {
                    saleModal.activate({
                        params: {
                            methods: data.PaymentMethods,
                            close() {
                                saleModal.deactivate();
                            }
                        }
                    });
                } else if (data.Error) {
                    return Promise.reject(data.Error);
                }
            });
            networkActivityTracker.track(promise);
        }
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'templates/directives/ui/saleLink.tpl.html',
            link(scope, element) {
                if (moment().isBetween('2016-11-25', '2016-11-29')) {
                    const anchor = element[0].querySelector('a');
                    anchor.addEventListener('click', onClick);
                    scope.$on('$destroy', () => {
                        anchor.removeEventListener('click', onClick);
                    });
                } else {
                    element.hide();
                }
            }
        };
    });

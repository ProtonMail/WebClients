angular.module('proton.ui')
    .directive('saleLink', ($interval, networkActivityTracker, Payment, saleModal) => {
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
        function repeat(element) {
            // element[0].style.display = (moment().isBetween('2016-11-24', '2016-11-29')) ? 'block' : 'none';
            element[0].style.display = 'none';
        }
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'templates/directives/ui/saleLink.tpl.html',
            link(scope, element) {
                const anchor = element[0].querySelector('a');
                const oneMinute = 1000 * 60;
                const promise = $interval(() => repeat(element), oneMinute);
                anchor.addEventListener('click', onClick);
                repeat(element);
                scope.$on('$destroy', () => {
                    anchor.removeEventListener('click', onClick);
                    $interval.cancel(promise);
                });
            }
        };
    });

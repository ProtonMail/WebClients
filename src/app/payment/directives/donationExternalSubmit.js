angular.module('proton.payment')
    .directive('donationExternalSubmit', ($rootScope) => ({
        compile(el) {
            el[0].classList.add('donationExternalSubmit-container');

            /**
             * This directive will be useless (maybe) with the new modal as we don't recreate the wheel. (tpl)donationExternalSubmit
             */
            return (scope, el) => {
                const onClick = () => {
                    $rootScope.$emit('payments', {
                        type: 'donation.input.submit',
                        data: {}
                    });
                };

                el.on('click', onClick);

                scope.$on('$destroy', () => {
                    el.off('click', onClick);
                });
            };
        }
    }));

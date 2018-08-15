/* @ngInject */
const donationExternalSubmit = (dispatchers) => ({
    compile(el) {
        el[0].classList.add('donationExternalSubmit-container');

        /**
         * This directive will be useless (maybe) with the new modal as we don't recreate the wheel. (tpl)donationExternalSubmit
         */
        return (scope, el) => {
            const { dispatcher } = dispatchers(['payments']);
            const onClick = () => {
                dispatcher.payments('donation.input.submit');
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        };
    }
});
export default donationExternalSubmit;

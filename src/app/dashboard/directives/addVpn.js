/* @ngInject */
function addVpn(dispatchers, gettextCatalog, translator) {

    const I18N = translator(() => ({
        ADD_PROTONVPN: gettextCatalog.getString('+ Add ProtonVPN', null, 'Button')
    }));

    return {
        restrict: 'E',
        replace: true,
        scope: {},
        template: `<button class="addVpn-button" type="button">
            <div class="addVpn-button-wrapper">
                <i class="addVpn-button-sign"></i>
                <span class="addVpn-button-txt">${I18N.ADD_PROTONVPN}</span>
            </div>
        </button>`,
        link(scope, element, { plan }) {
            const { dispatcher } = dispatchers(['dashboard']);
            const value = plan === 'free' ? 'vpnbasic' : 'vpnplus';
            const onClick = () => {
                dispatcher.dashboard('change.addon', { addon: 'vpn', plan: 'free', value });
                dispatcher.dashboard('change.addon', { addon: 'vpn', plan: 'plus', value });
                dispatcher.dashboard('change.addon', { addon: 'vpn', plan: 'professional', value });
            };

            element.on('click', onClick);
            scope.$on('$destroy', () => element.off('click', onClick));
        }
    };
}
export default addVpn;

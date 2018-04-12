import { SEND_TYPES } from '../../constants';

/* @ngInject */
function composerInputRecipient(sendPreferences, dispatchers) {
    return {
        replace: true,
        templateUrl: require('../../../templates/directives/composer/composerInputRecipient.tpl.html'),
        scope: {
            address: '@',
            name: '@'
        },
        link(scope) {
            const { on, unsubscribe, dispatcher } = dispatchers(['composerInputRecipient']);

            const updateLock = () => {
                sendPreferences.get([scope.email.Address]).then(({ [scope.email.Address]: sendPref }) =>
                    scope.$applyAsync(() => {
                        scope.email.encrypt = sendPref.encrypt;
                        scope.email.sign = sendPref.sign;
                        scope.email.encrypt = sendPref.encrypt;
                        scope.email.sign = sendPref.sign;
                        scope.email.isPgp = [SEND_TYPES.SEND_PGP_MIME, SEND_TYPES.SEND_PGP_INLINE].includes(
                            sendPref.scheme
                        );
                        scope.email.isPgpMime = sendPref.scheme === SEND_TYPES.SEND_PGP_MIME;
                        scope.email.isEO = sendPref.scheme === SEND_TYPES.SEND_EO;
                        scope.email.isPinned = sendPref.pinned;
                        scope.email.loadCryptInfo = false;
                        dispatcher.composerInputRecipient('refresh', { email: scope.email });
                    })
                );
            };
            on('contacts', (event, { type }) => {
                if (type !== 'contactEvents' && type !== 'contactUpdated') {
                    return;
                }
                updateLock();
            });
            on('mailSettings', (event, { data: { key } }) => {
                if (key !== 'Sign' && key !== 'all') {
                    return;
                }
                updateLock();
            });

            scope.email = { Address: scope.address, Name: scope.name, loadCryptInfo: true };
            updateLock();

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default composerInputRecipient;

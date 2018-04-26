import extendPGP from '../../../helpers/composerIconHelper';

/* @ngInject */
function composerInputRecipient(sendPreferences, dispatchers) {
    return {
        replace: true,
        templateUrl: require('../../../templates/directives/composer/composerInputRecipient.tpl.html'),
        scope: {
            address: '@',
            name: '@',
            index: '@',
            message: '<'
        },
        link(scope, el, { listKey, index }) {
            const { on, unsubscribe, dispatcher } = dispatchers(['composerInputRecipient']);

            const updateLock = () => {
                sendPreferences.get([scope.email.Address], scope.message).then(({ [scope.email.Address]: sendPref }) =>
                    scope.$applyAsync(() => {
                        scope.email = extendPGP(scope.email, sendPref);
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
            on('squire.messageSign', (event, { data: { messageID } }) => {
                if (messageID !== scope.message.ID) {
                    return;
                }
                updateLock();
            });
            on(
                'composer.update',
                (
                    event,
                    { type, data: { message = { ID: null }, list = null, listIndex = -1, address, name } = {} }
                ) => {
                    if ((type !== 'close.panel' && type !== 'recipients.modified') || message.ID !== scope.message.ID) {
                        return;
                    }
                    if (type === 'recipients.modified' && listKey === list && index === listIndex.toString()) {
                        scope.email = {
                            Address: address,
                            Name: name,
                            loadCryptInfo: address !== scope.email.Address
                        };
                    }
                    updateLock();
                }
            );
            scope.email = { Address: scope.address, Name: scope.name, loadCryptInfo: true };
            updateLock();

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default composerInputRecipient;

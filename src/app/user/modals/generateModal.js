import _ from 'lodash';

import { DEFAULT_ENCRYPTION_CONFIG } from '../../constants';

/* @ngInject */
function generateModal(
    dispatchers,
    pmModal,
    networkActivityTracker,
    notification,
    generateKeyModel,
    gettextCatalog,
    addressWithoutKeys,
    eventManager
) {
    const STATE = generateKeyModel.getStates();
    const I18N = {
        success(email) {
            return gettextCatalog.getString('Key created for {{email}}', { email }, 'Generate key modal');
        },
        title: gettextCatalog.getString('Setting up your Addresses', null, 'Title'),
        message: gettextCatalog.getString(
            'Before you can start sending and receiving emails from your new addresses you need to create encryption keys for them.',
            null,
            'Info'
        )
    };

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/generate.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { on, unsubscribe } = dispatchers();

            this.encryptionConfigName = DEFAULT_ENCRYPTION_CONFIG; // To match the [radio] value
            this.process = false;
            this.title = params.title || I18N.title;
            this.message = params.message || I18N.message;
            this.class = params.class || '';
            this.import = params.import;
            this.primary = params.primary;
            // Kill this for now
            this.askPassword = false; // = params.password.length === 0;
            this.password = params.password;
            this.cancel = () => params.close();
            this.addresses = _.map(params.addresses, (adr) => ((adr.state = STATE.QUEUED), adr));

            on('updateUser', () => {
                !addressWithoutKeys.fromUser().length && this.cancel();
            });

            this.submit = () => {
                this.process = true;
                const promise = Promise.all(
                    _.map(this.addresses, (address) =>
                        generateKeyModel.generate({
                            address,
                            encryptionConfigName: this.encryptionConfigName,
                            passphrase: this.password,
                            organizationKey: params.organizationKey,
                            memberMap: params.memberMap,
                            primary: this.primary
                        })
                    )
                )
                    .then((addresses = []) => addresses.filter((a) => a))
                    .then((addresses) => {
                        if (addresses.length) {
                            return eventManager.call().then(() => addresses);
                        }
                        return addresses;
                    })
                    .then((addresses) => addresses.forEach(({ Email }) => notification.success(I18N.success(Email))))
                    .then(params.onSuccess)
                    .catch((e) => {
                        params.close(this.addresses, this.password);
                        throw e;
                    });

                networkActivityTracker.track(promise);
            };

            this.$onDestroy = () => {
                unsubscribe();
            };
        }
    });
}
export default generateModal;

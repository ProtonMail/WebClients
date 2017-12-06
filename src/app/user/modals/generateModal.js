/* @ngInject */
function generateModal(
    pmModal,
    authentication,
    networkActivityTracker,
    Key,
    pmcw,
    notification,
    CONSTANTS,
    gettextCatalog,
    setupKeys,
    addressWithoutKeys
) {
    const I18N = {
        ERROR: gettextCatalog.getString('Error during create key request', null, 'Error'),
        success(email) {
            return gettextCatalog.getString('Key created for {{email}}', { email }, 'Generate key modal');
        },
        title: gettextCatalog.getString('Setting up your Addresses', null, 'Title'),
        message: gettextCatalog.getString(
            'Before you can start sending and receiving emails from your new addresses you need to create encryption keys for them. 4096-bit keys only work on high performance computers. For most users, we recommend using 2048-bit keys.',
            null,
            'Info'
        )
    };

    const STATE = {
        QUEUED: 0,
        GENERATING: 1,
        DONE: 2,
        SAVED: 3,
        ERROR: 4
    };

    const onSuccess = (address, key) => {
        address.state = STATE.SAVED;
        address.Keys = address.Keys || [];
        address.Keys.push(key);
        notification.success(I18N.success(address.Email));
    };

    const generateKey = (numBits, passphrase, { organizationKey, memberMap = {} }) => async (address) => {
        try {
            address.state = STATE.GENERATING;
            const { privateKeyArmored: PrivateKey } = await pmcw.generateKey({
                userIds: [{ name: address.Email, email: address.Email }],
                passphrase,
                numBits
            });

            address.state = STATE.DONE;

            const member = memberMap[address.ID] || {};
            if (member.ID) {
                const keys = await setupKeys.generateAddresses([address], 'temp', numBits);
                const key = await setupKeys.memberKey('temp', keys[0], member, organizationKey);
                return onSuccess(address, key);
            }

            const { data } = await Key.create({ AddressID: address.ID, PrivateKey });
            if (data.Code === 1000) {
                return onSuccess(address, data.Key);
            }
            throw new Error(data.Error || I18N.ERROR);
        } catch (e) {
            address.state = STATE.ERROR;
            throw e;
        }
    };

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/generate.tpl.html',
        /* @ngInject */
        controller: function(params, $scope) {
            this.size = CONSTANTS.ENCRYPTION_DEFAULT; // To match the [radio] value
            this.process = false;
            this.title = params.title || I18N.title;
            this.message = params.message || I18N.message;
            // Kill this for now
            this.askPassword = false; // = params.password.length === 0;
            this.password = params.password;
            this.cancel = () => params.close();
            this.addresses = _.map(params.addresses, (adr) => ((adr.state = STATE.QUEUED), adr));

            $scope.$on('updateUser', () => {
                !addressWithoutKeys.fromUser().length && this.cancel();
            });

            this.submit = () => {
                this.process = true;
                const promise = Promise.all(_.map(this.addresses, generateKey(this.size, this.password, params)))
                    .then(params.onSuccess)
                    .catch((e) => {
                        params.close(this.addresses, this.password);
                        throw e;
                    });
                networkActivityTracker.track(promise);
            };
        }
    });
}
export default generateModal;

import { PAID_ADMIN_ROLE } from '../../constants';

/* @ngInject */
function organizationKeysModel(
    organizationApi,
    dispatchers,
    $rootScope,
    authentication,
    formatKey,
    pmcw,
    memberModel,
    notification,
    generateOrganizationModal,
    eventManager,
    networkActivityTracker,
    gettextCatalog,
    activateOrganizationModal
) {
    const { on } = dispatchers();

    let CACHE = { keyStatus: 0 };
    const ALLOWED_STATES = ['signatures', 'domains', 'members'].map((n) => `secured.${n}`);

    const I18N = {
        MUST_PRIVATISE_ERROR: gettextCatalog.getString(
            'You must privatize all sub-accounts before generating new organization keys',
            null,
            'Error'
        ),
        ERROR_ALREADY_ACTIVE: gettextCatalog.getString('Organization keys already active', null, 'Error'),
        ERROR_DEFAULT: gettextCatalog.getString('Organization keys request failed', null, 'Error')
    };

    const get = (key = 'keys') => angular.copy(CACHE[key]);
    const set = async (key, value) => {
        if (key === 'organizationKey') {
            CACHE.organizationKey = await formatKey(value);
            return;
        }

        CACHE[key] = value;
    };
    const clear = () => (CACHE = { keyStatus: 0 });

    /**
     * Watcher for the state as we don't need the data everywhere
     */
    on('$stateChangeStart', (e, state) => {
        ALLOWED_STATES.includes(state.name) && clear();
    });

    function fetch() {
        return organizationApi
            .getKeys()
            .then(({ data = {} } = {}) => {
                set('keys', data);
                return data;
            })
            .catch(({ data = {} } = {}) => {
                throw new Error(data.Error || I18N.ERROR_DEFAULT);
            });
    }

    /**
     * Load keys from cache or lazy load them
     * @return {Promise} {}
     */
    const loadkeys = async () => (get() ? get() : fetch());

    /**
     * Manage user orga and find if we need to setup the orga
     * or if we found dirty Addresses
     * @param  {Object} organization
     * @return {Promise}
     */
    async function manage(organization) {
        if (authentication.user.Role !== PAID_ADMIN_ROLE) {
            return;
        }
        const { PublicKey, PrivateKey } = await loadkeys();
        if (PublicKey) {
            set('keyStatus', 0);
            const info = await pmcw.keyInfo(PublicKey);
            set('organizationKeyInfo', info);
        }

        if (!PrivateKey) {
            set('keyStatus', 1);
            return checkActivation(organization);
        }

        try {
            const key = await pmcw.decryptPrivateKey(PrivateKey, authentication.getPassword());
            set('organizationKey', key);
        } catch (e) {
            set('keyStatus', 2);
            console.error(e);
        }
        checkActivation(organization);
    }

    const generate = async (pkg) => {
        const keyInfo = await pmcw.keyInfo(pkg.toPublic().armor());
        set('organizationKeyInfo', keyInfo);
        set('keyStatus', 0);
        set('organizationKey', pkg);
    };

    const changeKeys = () => {
        const nonPrivate = memberModel.getNonPrivate();
        const otherAdmins = memberModel.hasAdmins();

        if (nonPrivate.length > 0 && get('keyStatus') > 0) {
            notification.error(I18N.MUST_PRIVATISE_ERROR);
            return;
        }

        generateOrganizationModal.activate({
            params: {
                nonPrivate,
                otherAdmins,
                existingKey: get('organizationKey'),
                submit(pkg) {
                    const promise = generate(pkg)
                        .then(generateOrganizationModal.deactivate)
                        .then(eventManager.call);
                    networkActivityTracker.track(promise);
                },
                cancel() {
                    generateOrganizationModal.deactivate();
                }
            }
        });
    };

    const activateKeys = (organization) => {
        if (!get('keyStatus') || get('keyStatus') > 2) {
            return notification.error(I18N.ERROR_ALREADY_ACTIVE);
        }

        activateOrganizationModal.activate({
            params: {
                keyStatus: get('keyStatus'),
                reset() {
                    activateOrganizationModal.deactivate();
                    changeKeys();
                },
                submit(pkg) {
                    set('keyStatus', 0);
                    set('organizationKey', pkg);
                    activateOrganizationModal.deactivate();
                    $rootScope.$emit('organizationChange', { data: organization });
                },
                cancel() {
                    activateOrganizationModal.deactivate();
                }
            }
        });
    };

    function checkActivation(organization) {
        if (organization.HasKeys === 1 && get('keyStatus') > 0) {
            activateKeys(organization);
        }
    }

    on('logout', clear);

    return {
        fetch,
        get,
        set,
        clear,
        manage,
        changeKeys,
        activateKeys
    };
}
export default organizationKeysModel;

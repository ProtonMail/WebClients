/* @ngInject */
function attachSignupSubscription(
    $rootScope,
    signupModel,
    authentication,
    setupKeys,
    organizationApi,
    gettextCatalog,
    eventManager,
    notification,
    Payment
) {
    const dispatch = (type, data = {}) => $rootScope.$emit('signup', { type, data });

    const I18N = {
        ERROR_ORGA_KEY_GENERATION: gettextCatalog.getString(
            'Error during the generation of new organization keys',
            null,
            'Error'
        ),
        ERROR_ORGA_REQUEST: gettextCatalog.getString(
            'Error during organization request',
            null,
            'Error organization creation'
        )
    };

    const processPlan = async () => {
        const { Name, Amount, Currency, Cycle, ID } = signupModel.get('temp.plan') || {};

        // if the user subscribed to a plan during the signup process
        if (['plus', 'visionary'].includes(Name) && Amount === authentication.user.Credit) {
            const subscribe = () => {
                return Payment.subscribe({ Amount: 0, Currency, Cycle, PlanIDs: { [ID]: 1 } }).catch(
                    ({ data = {} }) => {
                        throw Error(data.Error);
                    }
                );
            };

            const organizationKey = () => {
                return setupKeys
                    .generateOrganization(authentication.getPassword())
                    .then(({ privateKeyArmored: PrivateKey }) => ({ PrivateKey }))
                    .catch(() => {
                        throw new Error(I18N.ERROR_ORGA_KEY_GENERATION);
                    });
            };

            const createOrganization = (parameters) => {
                return organizationApi
                    .create(parameters)
                    .then(({ data = {} } = {}) => data)
                    .catch(({ data = {} } = {}) => {
                        throw new Error(data.Error || I18N.ERROR_ORGA_REQUEST);
                    });
            };

            return subscribe()
                .then(organizationKey)
                .then(createOrganization)
                .then(eventManager.call);
        }
    };

    const processPaymentMethod = async () => {
        const method = signupModel.get('temp.method') || {};
        // We save the payment method used during the subscription
        if (method.Type === 'card') {
            return Payment.updateMethod(method).catch(({ data = {} } = {}) => {
                throw Error(data.Error);
            });
        }
    };

    return () => {
        Promise.all([processPlan(), processPaymentMethod()])
            .then(() => {
                if (signupModel.get()) {
                    dispatch('user.subscription.finished', { plan: signupModel.get('temp.plan') });
                }
            })
            .then(() => signupModel.clear())
            .catch((error) => {
                notification.error(error);
                signupModel.clear();
            });
    };
}
export default attachSignupSubscription;

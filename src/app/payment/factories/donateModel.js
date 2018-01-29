/* @ngInject */
function donateModel(Payment, networkActivityTracker, gettextCatalog, notification, $rootScope) {
    const I18N = {
        credit: {
            error: gettextCatalog.getString('Error while processing credit.', null, 'Donation modal')
        },
        donation: {
            success: gettextCatalog.getString(
                'Your support is essential to keeping ProtonMail running. Thank you for supporting internet privacy!',
                null,
                'Donation modal'
            ),
            error: gettextCatalog.getString('Error while processing donation.', null, 'Donation modal')
        },
        topUp: {
            success: gettextCatalog.getString('Credits added', null, 'topUp modal')
        }
    };

    const dispatch = (type, data = {}) => $rootScope.$emit('payments', { type, data });

    const donate = (options = {}) => {
        const promise = Payment.donate(options)
            .then(() => I18N.donation.success)
            .catch(() => {
                throw new Error(I18N.donation.error);
            });

        networkActivityTracker.track(promise);
        return promise;
    };

    const addCredits = (options = {}) => {
        const promise = Payment.credit(options)
            .then(() => I18N.topUp.success)
            .catch(() => {
                throw new Error(I18N.credit.error);
            });

        networkActivityTracker.track(promise);
        return promise;
    };

    const getPromise = (type, options) => {
        if (type === 'topUp') {
            return addCredits(options);
        }
        return donate(options);
    };

    const allTheThings = ({ type, options, action }) => {
        // We have a custom process with humanVerification via signup
        if (action === 'humanVerification') {
            return;
        }

        dispatch(`${type}.request.load`);
        getPromise(type, options)
            .then(notification.success)
            .then(() => dispatch(`${type}.request.success`))
            .catch((e) => dispatch(`${type}.request.error`, e));
    };

    $rootScope.$on('payments', (e, { type, data = {} }) => {
        type === 'donate.submit' && allTheThings(data);
    });

    return { init: angular.noop };
}
export default donateModel;

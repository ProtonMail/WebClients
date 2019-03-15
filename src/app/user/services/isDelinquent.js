import { UNPAID_STATE, PAID_MEMBER_ROLE } from '../../constants';

/* @ngInject */
function isDelinquent($state, gettextCatalog, notification, authentication, translator) {
    const I18N = translator(() => ({
        ERROR_MEMBER: gettextCatalog.getString(
            'Account access restricted due to unpaid invoices. Please contact your administrator.',
            null,
            'Error'
        ),
        ERROR_ADMIN: gettextCatalog.getString(
            'Your account currently has an overdue invoice. Please pay all unpaid invoices.',
            null,
            'Error'
        )
    }));

    /**
     * Action on error, default use case the admin
     * @param  {String} state   State to redirect
     * @param  {String} message Error notification
     */
    const error = (state = 'secured.payments', message = I18N.ERROR_ADMIN) => {
        $state.go(state).then(() => {
            /**
             * Show the notification once all the promises has been resolved.
             * Otherwise it is closed by the network activity tracker.
             */
            notification.error(message);
        });
        throw new Error(message);
    };

    /**
     * Check if the user is delinquent
     * @return {Promise}
     */
    const test = async () => {
        const { Delinquent = 0, Role = PAID_MEMBER_ROLE } = authentication.user;

        if (Delinquent < UNPAID_STATE.DELINQUENT) {
            return;
        }

        if (Role === PAID_MEMBER_ROLE) {
            return error('login', I18N.ERROR_MEMBER);
        }

        error();
    };

    return test;
}
export default isDelinquent;

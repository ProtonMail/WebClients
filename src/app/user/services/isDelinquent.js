import { UNPAID_STATE, PAID_MEMBER_ROLE } from '../../constants';

/* @ngInject */
function isDelinquent($state, gettextCatalog, notification, authentication) {
    const I18N = {
        ERROR_MEMBER: gettextCatalog.getString(
            'Your account currently has an overdue invoice. Please contact your administrator.',
            null,
            'Error'
        ),
        ERROR_ADMIN: gettextCatalog.getString(
            'Your account currently has an overdue invoice. Please pay all unpaid invoices.',
            null,
            'Error'
        )
    };

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
        if (authentication.user.Delinquent < UNPAID_STATE.DELINQUENT) {
            return;
        }

        if (authentication.user.Role === PAID_MEMBER_ROLE) {
            error('login', I18N.ERROR_MEMBER);
        }

        error();
    };

    return test;
}
export default isDelinquent;

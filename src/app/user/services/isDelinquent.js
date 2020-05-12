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
    const error = (state, message = I18N.ERROR_ADMIN) => {
        if (!authentication.user.Keys.length) {
            return $state.go('login.setup');
        }
        return $state.go(state).then(() => {
            /**
             * Show the notification once all the promises has been resolved.
             * Otherwise it is closed by the network activity tracker.
             */
            notification.error(message);
        });
    };

    const getIsDelinquent = () => {
        const { Delinquent = 0 } = authentication.user;
        return Delinquent >= UNPAID_STATE.DELINQUENT;
    };

    const testAndRedirect = async () => {
        const { Role = PAID_MEMBER_ROLE } = authentication.user;
        const isDelinquent = getIsDelinquent();
        if (!isDelinquent) {
            return;
        }
        if (Role === PAID_MEMBER_ROLE) {
            return error('login', I18N.ERROR_MEMBER);
        }
        return error('secured.payments');
    };

    return {
        getIsDelinquent,
        testAndRedirect
    };
}
export default isDelinquent;

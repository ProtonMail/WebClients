import { c } from 'ttag';
import { AUTH_LOG_EVENTS } from './AuthLog';

export const getAuthLogEventsI18N = (type: AUTH_LOG_EVENTS) => {
    switch (type) {
        case AUTH_LOG_EVENTS.LOGIN_FAILURE_PASSWORD:
            return c('Log event').t`Sign in failure (wrong password)`;
        case AUTH_LOG_EVENTS.LOGIN_SUCCESS:
            return c('Log event').t`Sign in success`;
        case AUTH_LOG_EVENTS.LOGOUT:
            return c('Log event').t`Sign out`;
        case AUTH_LOG_EVENTS.LOGIN_FAILURE_2FA:
            return c('Log event').t`Sign in failure (second factor failed)`;
        case AUTH_LOG_EVENTS.LOGIN_SUCCESS_AWAIT_2FA:
            return c('Log event').t`Sign in success (awaiting second factor)`;

        case AUTH_LOG_EVENTS.REAUTH_FAILURE_PASSWORD:
            return c('Log event').t`Authentication failure (wrong password)`;
        case AUTH_LOG_EVENTS.REAUTH_FAILURE_2FA:
            return c('Log event').t`Authentication failure (second factor failed)`;
        case AUTH_LOG_EVENTS.REAUTH_SUCCESS:
            return c('Log event').t`Authentication success`;

        case AUTH_LOG_EVENTS.CHANGE_ACCOUNT_PASSWORD:
            return c('Log event').t`Account password change`;
        case AUTH_LOG_EVENTS.CHANGE_MAILBOX_PASSWORD:
            return c('Log event').t`Mailbox password change`;
        case AUTH_LOG_EVENTS.RESET_ACCOUNT:
            return c('Log event').t`Password reset`;

        case AUTH_LOG_EVENTS.ENABLE_MAILBOX_PASSWORD:
            return c('Log event').t`Two password mode enabled`;
        case AUTH_LOG_EVENTS.DISABLE_MAILBOX_PASSWORD:
            return c('Log event').t`Two password mode disabled`;

        case AUTH_LOG_EVENTS.ENABLE_TOTP:
            return c('Log event').t`Second factor enabled (authenticator app)`;
        case AUTH_LOG_EVENTS.DISABLE_TOTP:
            return c('Log event').t`Second factor disabled (authenticator app)`;
        case AUTH_LOG_EVENTS.ADD_U2F:
            return c('Log event').t`Second factor enabled (security key)`;
        case AUTH_LOG_EVENTS.REMOVE_U2F:
            return c('Log event').t`Second factor disabled (security key)`;
        default:
            return c('Log event').t`Unknown`;
    }
};

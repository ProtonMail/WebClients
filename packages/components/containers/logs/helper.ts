import { queryLogs } from 'proton-shared/lib/api/logs';
import queryPagesThrottled from 'proton-shared/lib/api/helpers/queryPagesThrottled';
import { Api } from 'proton-shared/lib/interfaces';
import { c } from 'ttag';
import { AUTH_LOG_EVENTS, AuthLog } from './interface';

export const getAllAuthenticationLogs = (api: Api) => {
    const pageSize = 150;

    const requestPage = (Page: number) =>
        api<{ Logs: AuthLog[]; Total: number }>(
            queryLogs({
                Page,
                PageSize: pageSize,
            })
        );

    return queryPagesThrottled({
        requestPage,
        pageSize,
        pagesPerChunk: 10,
        delayPerChunk: 100,
    }).then((pages) => {
        return pages.map(({ Logs }) => Logs).flat();
    });
};

export const getEventsI18N = () => ({
    [AUTH_LOG_EVENTS.LOGIN_FAILURE_PASSWORD]: c('Log event').t`Sign in failure (wrong password)`,
    [AUTH_LOG_EVENTS.LOGIN_SUCCESS]: c('Log event').t`Sign in success`,
    [AUTH_LOG_EVENTS.LOGOUT]: c('Log event').t`Sign out`,
    [AUTH_LOG_EVENTS.LOGIN_FAILURE_2FA]: c('Log event').t`Sign in failure (second factor failed)`,
    [AUTH_LOG_EVENTS.LOGIN_SUCCESS_AWAIT_2FA]: c('Log event').t`Sign in success (awaiting second factor)`,

    [AUTH_LOG_EVENTS.REAUTH_FAILURE_PASSWORD]: c('Log event').t`Authentication failure (wrong password)`,
    [AUTH_LOG_EVENTS.REAUTH_FAILURE_2FA]: c('Log event').t`Authentication failure (second factor failed)`,
    [AUTH_LOG_EVENTS.REAUTH_SUCCESS]: c('Log event').t`Authentication success`,

    [AUTH_LOG_EVENTS.CHANGE_ACCOUNT_PASSWORD]: c('Log event').t`Account password change`,
    [AUTH_LOG_EVENTS.CHANGE_MAILBOX_PASSWORD]: c('Log event').t`Mailbox password change`,
    [AUTH_LOG_EVENTS.RESET_ACCOUNT]: c('Log event').t`Password reset`,

    [AUTH_LOG_EVENTS.ENABLE_MAILBOX_PASSWORD]: c('Log event').t`Two password mode enabled`,
    [AUTH_LOG_EVENTS.DISABLE_MAILBOX_PASSWORD]: c('Log event').t`Two password mode disabled`,

    [AUTH_LOG_EVENTS.ENABLE_TOTP]: c('Log event').t`Second factor enabled (authenticator app)`,
    [AUTH_LOG_EVENTS.DISABLE_TOTP]: c('Log event').t`Second factor disabled (authenticator app)`,
    [AUTH_LOG_EVENTS.ADD_U2F]: c('Log event').t`Second factor enabled (security key)`,
    [AUTH_LOG_EVENTS.REMOVE_U2F]: c('Log event').t`Second factor disabled (security key)`,
});

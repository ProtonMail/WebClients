import { type FC, useCallback } from 'react';

import { c } from 'ttag';

import { CircleLoader, InlineLinkButton } from '@proton/atoms';
import { Icon, NotificationButton } from '@proton/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { AccountPath } from '@proton/pass/constants';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import type { Notification } from '@proton/pass/store/actions/enhancers/notification';
import { NotificationKey } from '@proton/pass/types/worker/notification';

import { usePassConfig } from './usePassConfig';

type NotificationEnhancerOptions = { onLink: (url: string) => void };

const ReactivateLink: FC<NotificationEnhancerOptions> = ({ onLink }) => {
    const { SSO_URL } = usePassConfig();

    return (
        <InlineLinkButton
            key="reactivate-link"
            className="text-semibold"
            onClick={() => onLink(`${SSO_URL}/encryption-keys`)}
        >
            {c('Action').t`Learn more`} <Icon name="arrow-out-square" />{' '}
        </InlineLinkButton>
    );
};

export const useNotificationEnhancer = () => {
    const { onLink } = usePassCore();
    const navigateToAccount = useNavigateToAccount(AccountPath.ACCOUNT_PASSWORD_2FA);

    return useCallback((notification: Notification): Notification => {
        const reactivateLink = <ReactivateLink onLink={onLink} key="reactactivate-link" />;

        switch (notification.key) {
            case NotificationKey.INACTIVE_SHARES: {
                return {
                    ...notification,
                    text: (
                        <div>
                            {c('Error')
                                .jt`Some vaults are no longer accessible due to a password reset. Reactivate your account keys in order to regain access. ${reactivateLink}`}
                        </div>
                    ),
                };
            }
            case NotificationKey.ORG_MISSING_2FA: {
                return {
                    ...notification,
                    text: (
                        <>
                            <span>{c('Info')
                                .t`Your account is restricted because your organization has enforced two-factor authentication. Please enable two-factor authentication in your Account Settings or contact your administrator.`}</span>
                            <NotificationButton onClick={navigateToAccount}>
                                {c('Action').t`Setup 2FA`}
                            </NotificationButton>
                        </>
                    ),
                };
            }
            default:
                return {
                    ...notification,
                    showCloseButton: notification.showCloseButton && !notification.loading,
                    text: notification.loading ? (
                        <>
                            {notification.text} <CircleLoader />
                        </>
                    ) : (
                        `${notification.text}${notification.errorMessage ? ` (${notification.errorMessage})` : ''}`
                    ),
                };
        }
    }, []);
};

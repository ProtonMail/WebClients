import { type FC, useCallback } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, InlineLinkButton } from '@proton/components/components';
import type { Notification } from '@proton/pass/store/actions/with-notification';
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

export const useNotificationEnhancer = (options: NotificationEnhancerOptions) =>
    useCallback((notification: Notification): Notification => {
        const reactivateLink = <ReactivateLink {...options} />;

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
            default:
                return {
                    ...notification,
                    showCloseButton: notification.showCloseButton && !notification.loading,
                    text: notification.loading ? (
                        <>
                            {notification.text} <CircleLoader />
                        </>
                    ) : (
                        notification.text
                    ),
                };
        }
    }, []);

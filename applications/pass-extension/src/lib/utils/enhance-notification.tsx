import { SSO_URL } from 'proton-pass-extension/app/config';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, InlineLinkButton } from '@proton/components/components';
import browser from '@proton/pass/lib/globals/browser';
import type { Notification } from '@proton/pass/store/actions/with-notification';
import { NotificationKey } from '@proton/pass/types/worker/notification';
import noop from '@proton/utils/noop';

const reactivateLink = (
    <InlineLinkButton
        key="reactivate-link"
        className="text-semibold"
        onClick={() => browser.tabs.create({ url: `${SSO_URL}/encryption-keys` }).catch(noop)}
    >
        {c('Action').t`Learn more`} <Icon name="arrow-out-square" />{' '}
    </InlineLinkButton>
);

export const enhanceNotification = (notification: Notification): Notification => {
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
};

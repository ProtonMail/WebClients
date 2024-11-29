import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components/index';
import { InAppNotificationState } from '@proton/pass/types';

import { withInAppNotification } from './WithInAppNotification';

export const InAppNotificationBanner: FC = withInAppNotification(
    ({ changeNotificationState, navigateToUrl, notification }) => {
        const position = EXTENSION_BUILD ? { '--top-custom': '100px' } : { '--bottom-custom': '100px' };

        return (
            <aside
                className="promo-banner fixed top-custom left-custom bottom-custom max-w-custom bg-norm p-4 rounded-lg border border-primary"
                style={{ ...position, '--left-custom': '.5rem', '--max-w-custom': '18rem' }}
                aria-live="polite"
                role="alert"
            >
                <Button
                    className="close-banner absolute top-custom right-custom"
                    style={{
                        '--top-custom': '-.5rem',
                        '--right-custom': '-.5rem',
                        padding: '0.25rem',
                        backgroundColor: 'var(--interaction-weak-major-2)',
                    }}
                    title={c('Action').t`Close`}
                    size="small"
                    color="weak"
                    shape="ghost"
                    onClick={() => changeNotificationState(notification.id, InAppNotificationState.DISMISSED)}
                    icon
                    pill
                >
                    <Icon name="cross" size={3} alt={c('Action').t`Close`} />
                </Button>
                <div>
                    {notification.content.imageUrl && (
                        <img
                            className="mb-2 max-w-custom"
                            style={{ '--max-w-custom': '4rem' }}
                            src={notification.content.imageUrl}
                            alt=""
                        />
                    )}
                    <div className="text-xl bold">{notification.content.title}</div>
                    <div className="text-base color-weak">{notification.content.message}</div>
                    {notification.content.cta && (
                        <Button
                            className="mt-4 color-white w-full"
                            color="norm"
                            shape="solid"
                            size="large"
                            pill
                            onClick={navigateToUrl}
                        >
                            {notification.content.cta.text}
                        </Button>
                    )}
                </div>
            </aside>
        );
    }
);

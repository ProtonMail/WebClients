import type { FC } from 'react';
import { createPortal } from 'react-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCross } from '@proton/icons/icons/IcCross';
import clsx from '@proton/utils/clsx';

import type { MaybeNull } from '../../types';
import { InAppNotificationState } from '../../types';
import { useInAppNotificationContainer } from './InAppNotificationPortal';
import { WithInAppNotification } from './WithInAppNotification';

export type NotificationBannerProps = {
    cta?: MaybeNull<{ disabled?: boolean; text: string; onClick: () => void }>;
    dense?: boolean;
    imageUrl?: MaybeNull<string>;
    message: string;
    title: string;
    onDismiss: () => void;
};

export const NotificationBanner: FC<NotificationBannerProps> = ({
    cta,
    dense,
    imageUrl,
    message,
    title,
    onDismiss,
}) => {
    const { container } = useInAppNotificationContainer();

    return (
        container?.current &&
        createPortal(
            <aside
                className={clsx(
                    'relative w-full bg-norm rounded-lg border border-primary',
                    dense ? 'p-3 text-sm' : 'p-4'
                )}
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
                    onClick={onDismiss}
                    icon
                    pill
                >
                    <IcCross size={3} alt={c('Action').t`Close`} />
                </Button>
                <div className={clsx('flex flex-column items-start', dense ? 'gap-1' : 'gap-2')}>
                    {imageUrl && (
                        <img
                            className="max-w-full max-h-custom pointer-events-none user-select-none object-contain"
                            style={{ '--max-h-custom': '4rem' }}
                            src={imageUrl}
                            alt=""
                        />
                    )}

                    <div className="text-lg">{title}</div>
                    <div className="lh120 color-weak">{message}</div>

                    {cta && (
                        <Button
                            className="text-ellipsis mt-1"
                            color="norm"
                            shape="solid"
                            size={dense ? 'small' : 'medium'}
                            pill
                            fullWidth
                            disabled={cta.disabled}
                            onClick={cta.onClick}
                        >
                            {cta.text}
                        </Button>
                    )}
                </div>
            </aside>,
            container.current
        )
    );
};

export const InAppNotificationBanner = WithInAppNotification(
    ({ dense, notification, setNotificationState, onAction }) => {
        const { content } = notification;

        return (
            <NotificationBanner
                cta={content.cta ? { text: content.cta.text, onClick: () => onAction() } : null}
                dense={dense}
                imageUrl={content.imageUrl}
                message={content.message}
                title={content.title}
                onDismiss={() => setNotificationState(InAppNotificationState.DISMISSED)}
            />
        );
    }
);

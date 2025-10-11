import { createPortal } from 'react-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import { InAppNotificationState } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import { useInAppNotificationContainer } from './InAppNotificationPortal';
import { WithInAppNotification } from './WithInAppNotification';

export const InAppNotificationBanner = WithInAppNotification(
    ({ dense, notification, setNotificationState, onAction }) => {
        const { container } = useInAppNotificationContainer();
        const { content } = notification;

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
                        onClick={() => setNotificationState(InAppNotificationState.DISMISSED)}
                        icon
                        pill
                    >
                        <Icon name="cross" size={3} alt={c('Action').t`Close`} />
                    </Button>
                    <div className={clsx('flex flex-column items-start', dense ? 'gap-1' : 'gap-2')}>
                        {content.imageUrl && (
                            <img
                                className="max-w-full max-h-custom pointer-events-none user-select-none object-contain"
                                style={{ '--max-h-custom': '4rem' }}
                                src={content.imageUrl}
                                alt=""
                            />
                        )}

                        <div className="text-lg">{content.title}</div>
                        <div className="lh120 color-weak">{content.message}</div>

                        {content.cta && (
                            <Button
                                className="text-ellipsis mt-1"
                                color="norm"
                                shape="solid"
                                size={dense ? 'small' : 'medium'}
                                pill
                                fullWidth
                                onClick={onAction}
                            >
                                {content.cta.text}
                            </Button>
                        )}
                    </div>
                </aside>,
                container.current
            )
        );
    }
);

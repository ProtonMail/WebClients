import type { FC } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import { ModalHeaderCloseButton } from '@proton/components/components/modalTwo/ModalHeader';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import type { InAppNotification } from '@proton/pass/types/data/notification';

type Props = {
    notification: InAppNotification;
    theme: 'dark' | 'light';
    onAction: () => void;
    onClose: () => void;
    onDismiss: () => void;
    isOffline?: boolean;
};

export const InAppNotificationPromoModal: FC<Props> = ({
    onAction,
    onClose,
    onDismiss,
    notification,
    theme,
    isOffline,
}) => {
    const { promoContents } = notification;
    if (!promoContents) return null;

    const themeValues = promoContents[theme];

    return (
        <PassModal className="overflow-auto relative" size="small" open onClose={onClose}>
            <div
                className="pt-4 rounded-none"
                style={{
                    backgroundSize: 'cover',
                    backgroundImage: `url(${themeValues.backgroundImageUrl})`,
                }}
            >
                <div className="absolute top-0 right-0 p-2">
                    <ModalHeaderCloseButton buttonProps={{ shape: 'solid', className: 'rounded-full opacity-70' }} />
                </div>

                <button className="block" onClick={onAction}>
                    <img
                        className="rounded-lg pointer-events-none user-select-none w-full max-w-full"
                        src={themeValues.contentImageUrl}
                        alt={notification.content.cta?.text}
                    />
                </button>

                {promoContents?.closePromoText && (
                    <Button
                        shape="ghost"
                        fullWidth
                        onClick={onDismiss}
                        style={{
                            '--button-default-text-color': themeValues.closePromoTextColor,
                            '--button-hover-text-color': themeValues.closePromoTextColor,
                        }}
                        disabled={isOffline}
                    >
                        {promoContents.closePromoText}
                    </Button>
                )}
            </div>
        </PassModal>
    );
};

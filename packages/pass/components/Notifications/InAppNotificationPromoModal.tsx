import { type FC, useState } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import { ModalHeaderCloseButton } from '@proton/components/components/modalTwo/ModalHeader';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import type { InAppNotification } from '@proton/pass/types/data/notification';
import { intoColorHex } from '@proton/pass/utils/dom/colors';

type Props = {
    disabled?: boolean;
    notification: InAppNotification;
    theme: 'dark' | 'light';
    onAction: () => void;
    onClose: () => void;
    onDismiss: () => void;
};

const InAppNotificationResource: FC<{ url: string; onEvent: () => void }> = ({ url, onEvent }) => (
    <img className="hidden" alt="" src={url} onLoad={onEvent} />
);

export const InAppNotificationPromoModal: FC<Props> = ({
    disabled,
    notification,
    theme,
    onAction,
    onClose,
    onDismiss,
}) => {
    const [resourcesLoaded, setResourcesLoaded] = useState(0);
    const onResourceEvent = () => setResourcesLoaded((prev) => prev + 1);
    const loaded = resourcesLoaded == 2;

    const { promoContents } = notification;
    if (!promoContents) return null;

    const themeValues = promoContents[theme];
    const closePromoTextColor = intoColorHex(themeValues.closePromoTextColor);

    return (
        <>
            <InAppNotificationResource key="bg" url={themeValues.backgroundImageUrl} onEvent={onResourceEvent} />
            <InAppNotificationResource key="content" url={themeValues.contentImageUrl} onEvent={onResourceEvent} />

            <PassModal
                className="overflow-auto relative"
                size="small"
                open={loaded}
                onClose={onClose}
                enableCloseWhenClickOutside
            >
                <div
                    className="pt-4 rounded-none"
                    style={{
                        backgroundSize: 'cover',
                        backgroundImage: `url(${themeValues.backgroundImageUrl})`,
                    }}
                >
                    <div className="absolute top-0 right-0 p-2">
                        <ModalHeaderCloseButton
                            buttonProps={{ shape: 'solid', className: 'rounded-full opacity-70' }}
                        />
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
                                '--button-default-text-color': closePromoTextColor,
                                '--button-hover-text-color': closePromoTextColor,
                            }}
                            disabled={disabled}
                        >
                            {promoContents.closePromoText}
                        </Button>
                    )}
                </div>
            </PassModal>
        </>
    );
};

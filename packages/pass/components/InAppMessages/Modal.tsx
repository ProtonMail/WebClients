import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwoFooter, ModalTwoHeader } from '@proton/components/index';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useInAppMessages } from '@proton/pass/components/InAppMessages/InAppMessagesProvider';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { selectNextNotification } from '@proton/pass/store/selectors';
import { InAppNotificationCtaType, InAppNotificationState } from '@proton/pass/types';

import './Modal.scss';

export const Modal: FC = () => {
    const { changeNotificationState } = useInAppMessages();
    const { onLink } = usePassCore();
    const notification = useSelector(selectNextNotification)!;

    const navigateToUrl = () => {
        onLink(notification.content.cta!.ref, {
            replace: notification.content.cta!.type === InAppNotificationCtaType.internal_navigation,
        });
        changeNotificationState(notification.id, InAppNotificationState.READ);
    };

    return (
        <PassModal size="small" open>
            <ModalTwoHeader
                hasClose={false}
                title={notification.content.title}
                subline={
                    <div className="flex items-center justify-center gap-5 mt-2">
                        {notification.content.imageUrl && (
                            <img
                                className="image-border mt-2 w-full rounded-lg"
                                src={notification.content.imageUrl}
                                alt=""
                            />
                        )}
                        <span className="text-ellipsis text-weak">{notification.content.message}</span>
                    </div>
                }
            />

            <ModalTwoFooter className="flex flex-column items-stretch text-center">
                {notification.content.cta && (
                    <Button
                        className="color-white mb-2"
                        color="norm"
                        shape="solid"
                        size="large"
                        onClick={navigateToUrl}
                    >
                        {notification.content.cta.text}
                    </Button>
                )}
                <Button
                    color="weak"
                    shape="solid"
                    size="large"
                    onClick={() => changeNotificationState(notification.id, InAppNotificationState.DISMISSED)}
                >
                    {c('Action').t`Not now`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};

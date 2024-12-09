import type { FC } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwoFooter, ModalTwoHeader } from '@proton/components/index';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { withInAppNotification } from '@proton/pass/components/Notifications/WithInAppNotification';
import { InAppNotificationState } from '@proton/pass/types';

import './InAppNotificationModal.scss';

export const InAppNotificationModal: FC = withInAppNotification(
    ({ changeNotificationState, readMessage, notification, getRedirectTo }) => (
        <PassModal size="small" open>
            <ModalTwoHeader
                hasClose={false}
                title={notification.content.title}
                subline={
                    <div className="flex items-center justify-center gap-5 mt-2">
                        {notification.content.imageUrl && (
                            <img
                                className="in-app-notification--image-border mt-2 w-full rounded-lg"
                                src={notification.content.imageUrl}
                                alt=""
                            />
                        )}
                        <span className="text-weak">{notification.content.message}</span>
                    </div>
                }
            />

            <ModalTwoFooter className="flex flex-column items-stretch text-center">
                {notification.content.cta && (
                    <Link className="mb-2" to={getRedirectTo(notification.content.cta.ref)}>
                        <Button className="w-full" color="norm" shape="solid" size="large" onClick={readMessage}>
                            {notification.content.cta.text}
                        </Button>
                    </Link>
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
    )
);

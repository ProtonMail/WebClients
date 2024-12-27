import type { FC } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwoFooter, ModalTwoHeader } from '@proton/components/index';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { withInAppNotification } from '@proton/pass/components/Notifications/WithInAppNotification';
import { InAppNotificationState } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import './InAppNotificationModal.scss';

export const InAppNotificationModal: FC = withInAppNotification(
    ({ changeNotificationState, readMessage, notification, getRedirectTo }) => (
        <PassModal className="overflow-auto" size="small" open>
            <ModalTwoHeader
                className="w-full"
                hasClose={false}
                title={notification.content.title}
                titleClassName="text-center"
                subline={
                    <div className="flex items-center justify-center gap-5 mt-2">
                        {notification.content.imageUrl && (
                            <img
                                className={clsx(
                                    'in-app-notification--image-border mt-2 rounded-lg pointer-events-none user-select-none',
                                    EXTENSION_BUILD ? 'max-w-custom' : 'w-full'
                                )}
                                style={{ '--max-w-custom': '10rem' }}
                                src={notification.content.imageUrl}
                                alt=""
                            />
                        )}
                        <span className="text-weak text-center w-full">{notification.content.message}</span>
                    </div>
                }
            />
            <ModalTwoFooter className="flex flex-column items-stretch text-center">
                {notification.content.cta && (
                    <Link className="w-full mb-2" to={getRedirectTo(notification.content.cta.ref)}>
                        <Button
                            className="text-ellipsis"
                            color="norm"
                            shape="solid"
                            size="large"
                            fullWidth
                            onClick={readMessage}
                        >
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

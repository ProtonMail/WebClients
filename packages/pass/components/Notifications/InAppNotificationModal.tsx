import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwoFooter, ModalTwoHeader } from '@proton/components/index';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { WithInAppNotification } from '@proton/pass/components/Notifications/WithInAppNotification';
import { InAppNotificationState } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import './InAppNotificationModal.scss';

export const InAppNotificationModal = WithInAppNotification(({ setNotificationState, onAction, notification }) => {
    const { content } = notification;

    return (
        <PassModal className="overflow-auto" size="small" open>
            <ModalTwoHeader
                className="w-full"
                hasClose={false}
                title={content.title}
                titleClassName="text-center"
                subline={
                    <div className="flex items-center justify-center gap-5 mt-2">
                        {content.imageUrl && (
                            <img
                                className={clsx(
                                    'in-app-notification--image-border mt-2 rounded-lg pointer-events-none user-select-none',
                                    EXTENSION_BUILD ? 'max-w-custom' : 'w-full'
                                )}
                                style={{ '--max-w-custom': '10rem' }}
                                src={content.imageUrl}
                                alt=""
                            />
                        )}
                        <span className="text-weak text-center w-full">{content.message}</span>
                    </div>
                }
            />

            <ModalTwoFooter className="flex flex-column items-stretch text-center gap-1">
                {content.cta && (
                    <Button
                        className="text-ellipsis"
                        color="norm"
                        shape="solid"
                        size="large"
                        fullWidth
                        onClick={onAction}
                        pill
                    >
                        {content.cta.text}
                    </Button>
                )}

                <Button
                    color="weak"
                    shape="solid"
                    size="large"
                    onClick={() => setNotificationState(InAppNotificationState.DISMISSED)}
                    pill
                >
                    {c('Action').t`Not now`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
});

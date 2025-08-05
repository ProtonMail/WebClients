import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwo, ModalTwoContent, useModalState } from '@proton/components';
import { IcPhone } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import { useMeetContext } from '../../contexts/MeetContext';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';

import './LeaveModal.scss';

interface LeaveModalProps {
    hasAdminPermission: boolean;
}

export const LeaveModal = ({ hasAdminPermission }: LeaveModalProps) => {
    const [modalProps, handleSetOpen, render] = useModalState();
    const { handleLeave, handleEndMeeting } = useMeetContext();

    const isLargerThanMd = useIsLargerThanMd();

    return (
        <div className="text-center">
            <Button
                className="px-8 py-4 leave-button border-none shrink-0"
                pill={true}
                size="large"
                onClick={() => handleSetOpen(true)}
                aria-label={c('l10n_nightly Alt').t`Leave Meeting`}
            >
                {isLargerThanMd ? (
                    c('l10n_nightly Alt').t`Leave`
                ) : (
                    <IcPhone className="shrink-0" size={5} style={{ transform: 'rotate(135deg)' }} />
                )}
            </Button>
            {render && (
                <ModalTwo {...modalProps} rootClassName="bg-transparent leave-modal" className="meet-radius">
                    <ModalTwoContent className="flex flex-column justify-space-between p-4 mx-4 pb-0">
                        <div className="text-center text-3xl">{c('l10n_nightly Action').t`Leave meeting`}</div>

                        <div className="w-full text-center color-weak">
                            {c('l10n_nightly Info').t`Are you sure you want to leave the meeting?`}
                        </div>

                        <div className="flex flex-column justify-end gap-2">
                            {hasAdminPermission && (
                                <Button
                                    className="border-none rounded-full w-full leave-meeting-button"
                                    onClick={handleEndMeeting}
                                    size="large"
                                >
                                    {c('l10n_nightly Action').t`End meeting for all`}
                                </Button>
                            )}
                            <Button
                                className={clsx(
                                    'border-none rounded-full w-full leave-meeting-button',
                                    hasAdminPermission ? 'leave-meeting-button-admin' : 'leave-meeting-button'
                                )}
                                onClick={handleLeave}
                                size="large"
                            >
                                {c('l10n_nightly Action').t`Leave meeting`}
                            </Button>
                            <Button
                                className="border-none rounded-full w-full close-button"
                                onClick={() => handleSetOpen(false)}
                                size="large"
                            >
                                {c('l10n_nightly Action').t`Cancel`}
                            </Button>
                        </div>
                    </ModalTwoContent>
                </ModalTwo>
            )}
        </div>
    );
};

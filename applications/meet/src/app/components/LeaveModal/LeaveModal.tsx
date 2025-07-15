import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwo, ModalTwoContent, useModalState } from '@proton/components';

import { useMeetContext } from '../../contexts/MeetContext';

import './LeaveModal.scss';

export const LeaveModal = () => {
    const [modalProps, handleSetOpen, render] = useModalState();
    const { handleLeave } = useMeetContext();

    return (
        <div className="text-center">
            <Button
                className="px-8 py-4 leave-button border-none"
                pill={true}
                size="large"
                onClick={() => handleSetOpen(true)}
                aria-label={c('l10n_nightly Alt').t`Leave Meeting`}
            >
                {c('l10n_nightly Alt').t`Leave`}
            </Button>
            {render && (
                <ModalTwo {...modalProps} rootClassName="bg-transparent leave-modal" className="meet-radius">
                    <ModalTwoContent className="flex flex-column justify-space-between p-4 mx-4 pb-0">
                        <div className="text-center text-3xl">{c('l10n_nightly Action').t`Leave Meeting`}</div>

                        <div className="w-full text-center color-weak">
                            {c('l10n_nightly Info').t`Are you sure you want to leave the meeting?`}
                        </div>

                        <div className="flex flex-column justify-end gap-2">
                            <Button
                                className="border-none rounded-full w-full leave-meeting-button"
                                onClick={handleLeave}
                                size="large"
                            >
                                {c('l10n_nightly Action').t`Leave Meeting`}
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

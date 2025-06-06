import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, useModalState } from '@proton/components';

import { useMeetContext } from '../../contexts/MeetContext';

import './LeaveModal.scss';

export const LeaveModal = () => {
    const [modalProps, handleSetOpen, render] = useModalState();
    const { handleLeave } = useMeetContext();

    return (
        <div className="text-center">
            <Button
                className="px-8 py-4 leave-button border-none color-invert"
                pill={true}
                size="large"
                onClick={() => handleSetOpen(true)}
                aria-label={c('l10n_nightly Alt').t`Leave Meeting`}
            >
                {c('l10n_nightly Alt').t`Leave`}
            </Button>
            {render && (
                <ModalTwo {...modalProps} rootClassName="bg-transparent">
                    <ModalTwoHeader title={c('l10n_nightly Action').t`Leave Meeting`} />
                    <ModalTwoContent>
                        <p>{c('l10n_nightly Info').t`Are you sure you want to leave the meeting?`}</p>
                    </ModalTwoContent>
                    <ModalTwoFooter className="flex justify-end gap-2">
                        <Button
                            className="rounded-full"
                            color="weak"
                            onClick={() => handleSetOpen(false)}
                        >
                            {c('l10n_nightly Action').t`Cancel`}
                        </Button>
                        <Button className="rounded-full" shape="outline" color="danger" onClick={handleLeave}>
                            {c('l10n_nightly Action').t`Leave Meeting`}
                        </Button>
                    </ModalTwoFooter>
                </ModalTwo>
            )}
        </div>
    );
};

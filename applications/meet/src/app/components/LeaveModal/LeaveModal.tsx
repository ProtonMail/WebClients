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
                className="px-8 py-4 leave-button border-none"
                pill={true}
                size="large"
                onClick={() => handleSetOpen(true)}
            >
                {c('Meet').t`Leave`}
            </Button>
            {render && (
                <ModalTwo {...modalProps} rootClassName="bg-transparent">
                    <ModalTwoHeader title={c('Meet').t`Leave Meeting`} />
                    <ModalTwoContent>
                        <p>{c('Meet').t`Are you sure you want to leave the meeting?`}</p>
                    </ModalTwoContent>
                    <ModalTwoFooter className="flex justify-end gap-2">
                        <Button className="rounded-full" color="weak" onClick={() => handleSetOpen(false)}>
                            {c('Meet').t`Cancel`}
                        </Button>
                        <Button className="rounded-full" shape="outline" color="danger" onClick={handleLeave}>
                            {c('Meet').t`Leave Meeting`}
                        </Button>
                    </ModalTwoFooter>
                </ModalTwo>
            )}
        </div>
    );
};

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { type ModalStateProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';

import glowingFolder from './glowingFolder.svg';

function FreeUploadOverModal({ ...modalProps }: ModalStateProps) {
    return (
        <ModalTwo {...modalProps}>
            <ModalTwoHeader />
            <ModalTwoContent>
                <img src={glowingFolder} alt="" />
                <div className="flex flex-column items-center text-center gap-2 mt-6 pb-6">
                    <h2 className="text-bold">{c('Title').t`You’re off to a great start!`}</h2>
                    <span className="text-lg">
                        {c('Onboarding Info')
                            .t`You just snagged some free data and secured your files with end-to-end encryption － in record time!`}
                    </span>
                    <span className="text-lg">
                        {c('Onboarding Info')
                            .t`Keep the momentum going by uploading more files using the storage included with your plan.`}
                    </span>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter className="flex justify-center">
                <Button color="norm" size="large" onClick={modalProps.onClose}>
                    {c('Onboarding Action').t`Upload more files`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
}

export function useFreeUploadOverModal() {
    return useModalTwoStatic(FreeUploadOverModal);
}

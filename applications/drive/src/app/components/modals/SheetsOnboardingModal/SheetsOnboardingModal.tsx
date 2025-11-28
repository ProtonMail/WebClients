import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import {
    type ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useActiveBreakpoint,
    useModalTwoStatic,
} from '@proton/components';
import useLocalState from '@proton/components/hooks/useLocalState';
import { SHEETS_APP_NAME } from '@proton/shared/lib/constants';

import { useFlagsDriveSheet } from '../../../flags/useFlagsDriveSheet';
import { useActiveShare } from '../../../hooks/drive/useActiveShare';
import { useDocumentActions } from '../../../store/_documents';
import screenshot from './sheetsScreenshot.webp';

function SheetsOnboardingModal(modalProps: ModalProps) {
    const { activeFolder } = useActiveShare();
    const { createDocument } = useDocumentActions();

    const handleCreateSpreadsheet = () => {
        void createDocument({
            type: 'sheet',
            shareId: activeFolder.shareId,
            parentLinkId: activeFolder.linkId,
        });
        modalProps.onClose?.();
    };

    return (
        <ModalTwo {...modalProps} size="xlarge">
            <ModalTwoHeader />
            <ModalTwoContent>
                <img src={screenshot} alt={c('Label').t`A screenshot of ${SHEETS_APP_NAME}`} />
                <div className="pt-6 px-8">
                    <h1 className="text-4xl text-bold">{c('Title').t`Introducing ${SHEETS_APP_NAME}`}</h1>
                    <p className="color-weak text-lg">
                        {c('Info')
                            .t`Your data stays yours. Create and collaborate using fully featured spreadsheets secured with end-to-end encryption.`}
                    </p>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter className="flex justify-start gap-4 px-8 pb-4">
                <Button size="large" color="success" onClick={handleCreateSpreadsheet}>
                    {c('Action').t`Create a spreadsheet`}
                </Button>
                <Button size="large" shape="outline" onClick={modalProps.onClose}>
                    {c('Onboarding Action').t`Maybe later`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
}

export const useSheetsOnboardingModal = () => {
    const sheetsEnabled = useFlagsDriveSheet();
    const [sheetsOnboardingModal, showSheetsOnboardingModal] = useModalTwoStatic(SheetsOnboardingModal);
    const [alreadyShown, setAlreadyShown] = useLocalState(false, 'modal_sheets_onboarding_shown');

    const { viewportWidth } = useActiveBreakpoint();
    const isSmallViewport = viewportWidth['<=small'];

    const shouldShow = sheetsEnabled && !alreadyShown && !isSmallViewport;

    useEffect(() => {
        if (shouldShow) {
            showSheetsOnboardingModal({});
            setAlreadyShown(true);
        }
    }, [alreadyShown, isSmallViewport, setAlreadyShown, sheetsEnabled, shouldShow, showSheetsOnboardingModal]);

    return sheetsOnboardingModal;
};

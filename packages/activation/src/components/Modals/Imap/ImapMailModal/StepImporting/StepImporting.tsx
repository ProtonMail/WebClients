import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { IA_PATHNAME_REGEX } from '@proton/activation/src/constants';
import { resetImapDraft } from '@proton/activation/src/logic/draft/imapDraft/imapDraft.actions';
import { selectImapDraftMailImport } from '@proton/activation/src/logic/draft/imapDraft/imapDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { Button } from '@proton/atoms/Button';
import {
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    useSettingsLink,
} from '@proton/components';

import StepImportingContent from './StepImportingContent';

const StepImporting = () => {
    const dispatch = useEasySwitchDispatch();
    const location = useLocation();
    const isCurrentLocationImportPage = IA_PATHNAME_REGEX.test(location.pathname);
    const mailImport = useEasySwitchSelector(selectImapDraftMailImport);
    const settingsLink = useSettingsLink();

    const handleClose = () => {
        dispatch(resetImapDraft());
    };

    return (
        <ModalTwo onClose={handleClose} size="xlarge" open>
            <ModalTwoHeader />
            <ModalTwoContent>
                <StepImportingContent
                    importedEmailAddress={mailImport?.email || ''}
                    isCurrentLocationImportPage={isCurrentLocationImportPage}
                    onClose={() => {
                        dispatch(resetImapDraft());
                    }}
                    toEmail={mailImport?.fields?.importAddress.Email || ''}
                />
            </ModalTwoContent>

            <ModalTwoFooter className="justify-end">
                {!isCurrentLocationImportPage ? (
                    <PrimaryButton
                        onClick={() => {
                            dispatch(resetImapDraft());
                            settingsLink(`/easy-switch`);
                        }}
                        data-testid="StepImport:redirectButton"
                    >
                        {c('Action').t`Check import progress`}
                    </PrimaryButton>
                ) : null}
                <Button shape="outline" onClick={handleClose} data-testid="StepImport:closeButton">
                    {c('Action').t`Close`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default StepImporting;

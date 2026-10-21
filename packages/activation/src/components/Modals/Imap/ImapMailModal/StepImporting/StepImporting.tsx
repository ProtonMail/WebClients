import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

import { IA_PATHNAME_REGEX } from '../../../../../constants';
import { resetImapDraft } from '../../../../../logic/draft/imapDraft/imapDraft.actions';
import { selectImapDraftMailImport } from '../../../../../logic/draft/imapDraft/imapDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '../../../../../logic/store';
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
                    <Button
                        color="norm"
                        onClick={() => {
                            dispatch(resetImapDraft());
                            settingsLink(`/easy-switch`);
                        }}
                        data-testid="StepImport:redirectButton"
                    >
                        {c('Action').t`Check import progress`}
                    </Button>
                ) : null}
                <Button shape="outline" onClick={handleClose} data-testid="StepImport:closeButton">
                    {c('Action').t`Close`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default StepImporting;

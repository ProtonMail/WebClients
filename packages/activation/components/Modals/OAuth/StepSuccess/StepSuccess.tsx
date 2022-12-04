import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { IA_PATHNAME_REGEX } from '@proton/activation/constants';
import { resetOauthDraft } from '@proton/activation/logic/draft/oauthDraft/oauthDraft.actions';
import { selectOauthImportStateImporterData } from '@proton/activation/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/logic/store';
import { Button } from '@proton/atoms/Button';
import {
    ModalTwo,
    ModalTwoContent,
    PrimaryButton,
    SettingsLink,
    useModalState,
    useSettingsLink,
} from '@proton/components/components';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import importStartedSvg from '@proton/styles/assets/img/onboarding/import-assistant.svg';

interface Props {
    isCurrentLocationImportPage: boolean;
    handleModalDisplay: (val: boolean) => void;
}

const StepSuccessFooterAction = ({ handleModalDisplay, isCurrentLocationImportPage }: Props) => {
    const dispatch = useEasySwitchDispatch();

    const settingsLink = useSettingsLink();

    if (isCurrentLocationImportPage) {
        return (
            <ModalFooter className="flex-justify-end">
                <Button
                    data-testid="StepSuccess:CloseButton"
                    shape="outline"
                    onClick={() => {
                        dispatch(resetOauthDraft());
                        handleModalDisplay(false);
                    }}
                >
                    {c('Action').t`Close`}
                </Button>
            </ModalFooter>
        );
    }
    return (
        <ModalFooter data-testid="StepSuccess:RedirectFooter">
            <Button
                shape="outline"
                onClick={() => handleModalDisplay(false)}
                data-testid="StepSuccess:RedirectFooterSubmit"
            >
                {c('Action').t`Close`}
            </Button>
            <PrimaryButton
                onClick={() => {
                    dispatch(resetOauthDraft());
                    handleModalDisplay(false);
                    settingsLink(`/easy-switch`);
                }}
            >{c('Action').t`Check import progress`}</PrimaryButton>
        </ModalFooter>
    );
};

const StepSuccess = () => {
    const location = useLocation();
    const [modalProps, handleModalDisplay] = useModalState({ open: true });

    const importerData = useEasySwitchSelector(selectOauthImportStateImporterData);
    const isCurrentLocationImportPage = IA_PATHNAME_REGEX.test(location.pathname);

    const toEmail = importerData?.emails?.fields?.importAddress.Email;
    const fromEmail = importerData?.importedEmail;

    const importProgressLink = (
        <SettingsLink key="link" path="/easy-switch" onClick={() => handleModalDisplay(false)}>{c('Info')
            .t`here`}</SettingsLink>
    );

    return (
        <ModalTwo {...modalProps} size="xlarge">
            <ModalTwoContent>
                <div className="text-center mb2" data-testid="StepSuccess:Modal">
                    <img src={importStartedSvg} alt="" className="max-w80" />
                    <h3>{c('Info').t`Import in progress`}</h3>
                    <div className="mb1">{c('Info').t`Importing your data from ${fromEmail} to ${toEmail}.`}</div>
                    <div>{c('Info').t`We'll notify you when the import is done.`}</div>
                    <div className="mb1">{c('Info').t`Large imports can take several days.`}</div>

                    {!isCurrentLocationImportPage && (
                        <div className="mb1" data-testid="StepSuccess:SettingsLink">{c('Info')
                            .jt`You can check the progress ${importProgressLink}.`}</div>
                    )}

                    <div>{c('Info').t`Close this screen to exit.`}</div>
                </div>
            </ModalTwoContent>
            <StepSuccessFooterAction
                handleModalDisplay={handleModalDisplay}
                isCurrentLocationImportPage={isCurrentLocationImportPage}
            />
        </ModalTwo>
    );
};

export default StepSuccess;

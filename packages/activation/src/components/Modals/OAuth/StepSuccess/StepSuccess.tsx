import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { IA_PATHNAME_REGEX } from '@proton/activation/src/constants';
import { resetOauthDraft } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.actions';
import { selectOauthImportStateImporterData } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { Button } from '@proton/atoms/Button';
import {
    ModalTwo,
    ModalTwoContent,
    PrimaryButton,
    SettingsLink,
    useModalState,
    useSettingsLink,
} from '@proton/components';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import importStartedSvg from '@proton/styles/assets/img/onboarding/import-assistant.svg';

interface Props {
    isCurrentLocationImportPage: boolean;
    handleModalDisplay: (val: boolean) => void;
}

const StepSuccessFooterAction = ({ handleModalDisplay, isCurrentLocationImportPage }: Props) => {
    const dispatch = useEasySwitchDispatch();

    const settingsLink = useSettingsLink();

    const handleClose = (redirect?: boolean) => {
        dispatch(resetOauthDraft());
        handleModalDisplay(false);

        if (redirect) {
            settingsLink(`/easy-switch`);
        }
    };

    if (isCurrentLocationImportPage) {
        return (
            <ModalFooter className="justify-end">
                <Button data-testid="StepSuccess:CloseButton" shape="outline" onClick={() => handleClose(false)}>
                    {c('Action').t`Close`}
                </Button>
            </ModalFooter>
        );
    }
    return (
        <ModalFooter data-testid="StepSuccess:RedirectFooter">
            <Button shape="outline" onClick={() => handleClose(false)} data-testid="StepSuccess:RedirectFooterSubmit">
                {c('Action').t`Close`}
            </Button>
            <PrimaryButton onClick={() => handleClose(true)}>{c('Action').t`Check import progress`}</PrimaryButton>
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
                <div className="text-center mb-8" data-testid="StepSuccess:Modal">
                    <img src={importStartedSvg} alt="" className="max-w-4/5" />
                    <h3 className="mb-4">{c('Info').t`Import in progress`}</h3>
                    <section className="flex flex-column gap-2 items-center">
                        <p className="m-0">{c('Info').t`Importing your data from ${fromEmail} to ${toEmail}.`}</p>
                        <p className="py-2 px-4 my-4 rounded bg-info" style={{ width: 'fit-content' }}>
                            <p className="m-0 mb-2">{c('Info').t`We'll email you once import is complete.`}</p>
                            <p className="m-0">{c('Info').t`You can close the tab or browser in the meantime.`}</p>
                        </p>

                        {!isCurrentLocationImportPage && (
                            <p className="m-0" data-testid="StepSuccess:SettingsLink">{c('Info')
                                .jt`You can check the progress ${importProgressLink}.`}</p>
                        )}
                    </section>
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

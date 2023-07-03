import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { ModalStateProps, ModalTwo, ModalTwoContent, ModalTwoHeader, SettingsLink } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import onboardingImportAssistant from '@proton/styles/assets/img/onboarding/import-assistant.svg';

const ModalImportEmails = (props: ModalStateProps) => {
    return (
        <ModalTwo {...props}>
            <ModalTwoContent className="modal-content py-7 text-center">
                <ModalTwoHeader />
                <div className="mx-auto">
                    <img
                        src={onboardingImportAssistant}
                        alt={c('Get started checklist instructions').t`Import your contacts or messages`}
                    />
                </div>
                <h1 className="mb-2 text-2xl text-bold">
                    {c('Get started checklist instructions').t`Import your contacts or messages`}
                </h1>
                <p className="mb-8">
                    {c('Get started checklist instructions')
                        .t`Quickly transfer your contacts or emails from any provider using our Easy Switch import assistant.`}
                </p>
                <ButtonLike
                    fullWidth
                    color="norm"
                    as={SettingsLink}
                    app={APPS.PROTONMAIL}
                    path="/easy-switch"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    {c('Get started checklist instructions').t`Import contacts or emails`}
                </ButtonLike>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default ModalImportEmails;

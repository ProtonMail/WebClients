import { c } from 'ttag';
import {
    ButtonLike,
    DialogModal,
    InnerModal,
    SettingsLink,
    ModalPropsInjection,
    ModalCloseButton,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import onboardingImportAssistant from '@proton/styles/assets/img/onboarding/import-assistant.svg';

const ModalImportContactsOrEmails = ({ onClose, ...rest }: Partial<ModalPropsInjection>) => {
    return (
        <DialogModal intermediate onClose {...rest}>
            <ModalCloseButton onClose={onClose} />
            <InnerModal className="modal-content pb2 pt2 text-center">
                <div className="mlauto mrauto">
                    <img
                        src={onboardingImportAssistant}
                        alt={c('Get started checklist instructions').t`Import your messages`}
                    />
                </div>
                <h1 className="mb0-5 text-2xl text-bold">
                    {c('Get started checklist instructions').t`Import your contacts or messages`}
                </h1>
                <p className="mb2">
                    {c('Get started checklist instructions')
                        .t`Quickly transfer your contacts or emails from any provider using our Easy Switch import assistant.`}
                </p>
                <ButtonLike
                    fullWidth
                    color="norm"
                    as={SettingsLink}
                    app={APPS.PROTONMAIL}
                    path="/import-export"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {c('Get started checklist instructions').t`Import contacts or messages`}
                </ButtonLike>
            </InnerModal>
        </DialogModal>
    );
};

export default ModalImportContactsOrEmails;

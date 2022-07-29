import { c } from 'ttag';

import {
    ButtonLike,
    DialogModal,
    InnerModal,
    ModalCloseButton,
    ModalPropsInjection,
    SettingsLink,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import onboardingImportAssistant from '@proton/styles/assets/img/onboarding/import-assistant.svg';

const ModalImportEmails = ({ onClose, ...rest }: Partial<ModalPropsInjection>) => {
    return (
        /* TODO Modal refactor */
        /* eslint-disable-next-line deprecation/deprecation */
        <DialogModal intermediate onClose {...rest}>
            <ModalCloseButton onClose={onClose} />
            <InnerModal className="modal-content pb2 pt2 text-center">
                <div className="mlauto mrauto">
                    <img
                        src={onboardingImportAssistant}
                        alt={c('Get started checklist instructions').t`Import your contacts or messages`}
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
                    path="/easy-switch"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    {c('Get started checklist instructions').t`Import contacts or emails`}
                </ButtonLike>
            </InnerModal>
        </DialogModal>
    );
};

export default ModalImportEmails;

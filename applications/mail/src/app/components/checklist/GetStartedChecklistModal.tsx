import {
    useModals,
    useIsMnemonicAvailable,
    useSettingsLink,
    useUser,
    getCanReactiveMnemonic,
    ModalProps,
    ModalTwo as Modal,
    ModalTwoHeader as ModalHeader,
    ModalTwoContent as ModalContent,
} from '@proton/components';
import { ChecklistKey } from '@proton/shared/lib/interfaces';

import GetStartedChecklist from './GetStartedChecklist';
import ModalGetMobileApp from './ModalGetMobileApp';
import ModalImportEmails from './ModalImportEmails';

interface MailGetStartedChecklistModalProps extends ModalProps {
    onSendMessage: () => void;
    onMnemonicItemSelection: () => void;
}

const MailGetStartedChecklistModal = ({
    onSendMessage,
    onMnemonicItemSelection,
    ...rest
}: MailGetStartedChecklistModalProps) => {
    const [user] = useUser();
    const { createModal } = useModals();
    const goToSettings = useSettingsLink();

    const [isMnemonicAvailable] = useIsMnemonicAvailable();
    const canReactivateMnemonic = getCanReactiveMnemonic(user);
    const displayMnemonicPrompt = isMnemonicAvailable && canReactivateMnemonic;

    const handleItemSelection = (key: ChecklistKey) => () => {
        /* eslint-disable default-case */
        switch (key) {
            case ChecklistKey.SendMessage: {
                onSendMessage();
                break;
            }

            case ChecklistKey.MobileApp: {
                createModal(<ModalGetMobileApp />);
                break;
            }

            case ChecklistKey.RecoveryMethod: {
                if (displayMnemonicPrompt) {
                    onMnemonicItemSelection();
                } else {
                    goToSettings('/recovery', undefined, true);
                }
                break;
            }

            case ChecklistKey.Import: {
                createModal(<ModalImportEmails />);
                break;
            }
        }

        rest.onClose?.();
    };

    return (
        <Modal size="medium" {...rest}>
            <ModalHeader />
            <ModalContent>
                <GetStartedChecklist onItemSelection={handleItemSelection} />
            </ModalContent>
        </Modal>
    );
};

export default MailGetStartedChecklistModal;

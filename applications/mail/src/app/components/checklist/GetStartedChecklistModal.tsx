import {
    DialogModal,
    ModalCloseButton,
    InnerModal,
    ModalPropsInjection,
    useModals,
    useModalState,
    useIsMnemonicAvailable,
    useSettingsLink,
    useUser,
    getCanReactiveMnemonic,
} from '@proton/components';
import { MnemonicPromptModal } from '@proton/components/containers/mnemonic';
import { ChecklistKey } from '@proton/shared/lib/interfaces';

import GetStartedChecklist from './GetStartedChecklist';
import ModalGetMobileApp from './ModalGetMobileApp';
import ModalImportEmails from './ModalImportEmails';

interface MailGetStartedChecklistModalProps extends Partial<ModalPropsInjection> {
    onSendMessage: () => void;
}

const MailGetStartedChecklistModal = ({ onClose, onSendMessage, ...rest }: MailGetStartedChecklistModalProps) => {
    const [user] = useUser();
    const { createModal } = useModals();
    const [mnemonicPromptModal, setMnemonicPromptModalOpen] = useModalState();
    const goToSettings = useSettingsLink();

    const [isMnemonicAvailable] = useIsMnemonicAvailable();
    const canReactivateMnemonic = getCanReactiveMnemonic(user);
    const displayMnemonicPrompt = isMnemonicAvailable && canReactivateMnemonic;

    return (
        <>
            <MnemonicPromptModal {...mnemonicPromptModal} />
            {/* TODO Modal refactor */}
            {/* eslint-disable-next-line deprecation/deprecation */}
            <DialogModal intermediate onClose={onClose} {...rest}>
                <ModalCloseButton onClose={onClose} />
                <InnerModal className="modal-content pb2 pt2">
                    <GetStartedChecklist
                        onItemSelection={(key: ChecklistKey) => () => {
                            onClose?.();

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
                                        setMnemonicPromptModalOpen(true);
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
                        }}
                    />
                </InnerModal>
            </DialogModal>
        </>
    );
};

export default MailGetStartedChecklistModal;

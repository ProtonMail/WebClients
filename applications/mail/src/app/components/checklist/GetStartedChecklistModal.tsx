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
import { GetStartedChecklistKey } from '@proton/shared/lib/interfaces';

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
                        hideDismissButton
                        onItemSelection={(key: GetStartedChecklistKey) => () => {
                            onClose?.();

                            /* eslint-disable default-case */
                            switch (key) {
                                case GetStartedChecklistKey.SendMessage: {
                                    onSendMessage();
                                    break;
                                }

                                case GetStartedChecklistKey.MobileApp: {
                                    createModal(<ModalGetMobileApp />);
                                    break;
                                }

                                case GetStartedChecklistKey.RecoveryMethod: {
                                    if (displayMnemonicPrompt) {
                                        setMnemonicPromptModalOpen(true);
                                    } else {
                                        goToSettings('/recovery', undefined, true);
                                    }
                                    break;
                                }

                                case GetStartedChecklistKey.Import: {
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

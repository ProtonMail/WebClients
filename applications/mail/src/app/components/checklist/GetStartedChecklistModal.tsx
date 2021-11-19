import {
    DialogModal,
    ModalCloseButton,
    InnerModal,
    ModalPropsInjection,
    useModals,
    useIsMnemonicAvailable,
    useSettingsLink,
    useUser,
} from '@proton/components';
import { MnemonicPromptModal } from '@proton/components/containers/mnemonic';
import { GetStartedChecklistKey, MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';

import GetStartedChecklist from './GetStartedChecklist';
import ModalGetMobileApp from './ModalGetMobileApp';
import ModalImportEmails from './ModalImportEmails';

interface MailGetStartedChecklistModalProps extends Partial<ModalPropsInjection> {
    onSendMessage: () => void;
}

const MailGetStartedChecklistModal = ({ onClose, onSendMessage, ...rest }: MailGetStartedChecklistModalProps) => {
    const [user] = useUser();
    const { createModal } = useModals();
    const goToSettings = useSettingsLink();

    const [isMnemonicAvailable] = useIsMnemonicAvailable();
    const canReactivateMnemonic =
        user.MnemonicStatus === MNEMONIC_STATUS.PROMPT ||
        user.MnemonicStatus === MNEMONIC_STATUS.ENABLED ||
        user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED;
    const displayMnemonicPrompt = isMnemonicAvailable && canReactivateMnemonic;

    return (
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
                                    createModal(<MnemonicPromptModal />);
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
    );
};

export default MailGetStartedChecklistModal;

import {
    DialogModal,
    ModalCloseButton,
    InnerModal,
    ModalPropsInjection,
    useModals,
    useIsMnemonicAvailable,
    useSettingsLink,
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
    const { createModal } = useModals();
    const [isMnemonicAvailable] = useIsMnemonicAvailable();
    const goToSettings = useSettingsLink();

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
                                if (isMnemonicAvailable) {
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

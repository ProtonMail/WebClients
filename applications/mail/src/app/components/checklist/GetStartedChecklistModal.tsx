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

import { MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';
import GetStartedChecklist from './GetStartedChecklist';
import ModalGetMobileApp from './ModalGetMobileApp';
import ModalImportEmails from './ModalImportEmails';

const MailGetStartedChecklistModal = ({ onClose, ...rest }: Partial<ModalPropsInjection>) => {
    const onCompose = useOnCompose();
    const { createModal } = useModals();
    const isMnemonicAvailable = useIsMnemonicAvailable();
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
                                onCompose({ action: MESSAGE_ACTIONS.NEW });
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
                                    goToSettings('/authentication#recovery-notification');
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

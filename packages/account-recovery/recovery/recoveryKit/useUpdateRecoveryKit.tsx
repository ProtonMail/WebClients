import { useState } from 'react';

import type { selectMnemonicData } from '@proton/account/recovery/mnemonic';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import DisableMnemonicModal from '@proton/components/containers/mnemonic/DisableMnemonicModal';
import { useRecoverySettingsTelemetry } from '@proton/components/containers/recovery/recoverySettingsTelemetry';

import RecoveryKitModal from './RecoveryKitModal';

export const useUpdateRecoveryKit = (mnemonicData: ReturnType<typeof selectMnemonicData>) => {
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const [recoveryKitModal, setRecoveryKitModalOpen, renderRecoveryKitModal] = useModalState();
    const [disableMnemonicModal, setDisableMnemonicModalOpen, renderDisableMnemonicModal] = useModalState();
    // Keeps the card hidden until the modal fully closes
    const [firstRunModalIsOpen, setFirstRunModalIsOpen] = useState(false);

    return {
        el: (
            <>
                {renderRecoveryKitModal && (
                    <RecoveryKitModal
                        {...recoveryKitModal}
                        onClose={() => {
                            setFirstRunModalIsOpen(false);
                            recoveryKitModal.onClose?.();
                        }}
                        onSuccess={() => sendRecoverySettingEnabled({ setting: 'recovery_phrase' })}
                    />
                )}
                {renderDisableMnemonicModal && <DisableMnemonicModal {...disableMnemonicModal} />}
            </>
        ),
        showExistingRecoveryPhraseCard: mnemonicData.isMnemonicSet && !firstRunModalIsOpen,
        updatePhrase: () => {
            setRecoveryKitModalOpen(true);
        },
        createPhrase: () => {
            setFirstRunModalIsOpen(true);
            setRecoveryKitModalOpen(true);
        },
        updateToggle: (checked: boolean) => {
            if (checked) {
                setRecoveryKitModalOpen(true);
            } else {
                setDisableMnemonicModalOpen(true);
            }
        },
        toggleLoading: disableMnemonicModal.open || recoveryKitModal.open,
    };
};

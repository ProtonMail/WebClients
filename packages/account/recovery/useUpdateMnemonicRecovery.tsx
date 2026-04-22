import type { selectMnemonicData } from '@proton/account/recovery/mnemonic';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import DisableMnemonicModal from '@proton/components/containers/mnemonic/DisableMnemonicModal';
import GenerateMnemonicModal from '@proton/components/containers/mnemonic/GenerateMnemonicModal';
import { useRecoverySettingsTelemetry } from '@proton/components/containers/recovery/recoverySettingsTelemetry';
import useSearchParamsEffect from '@proton/components/hooks/useSearchParamsEffect';

export const useUpdateMnemonicRecovery = (mnemonicData: ReturnType<typeof selectMnemonicData>) => {
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();

    const [disableMnemonicModal, setDisableMnemonicModalOpen, renderDisableMnemonicModal] = useModalState();
    const [generateMnemonicModal, setGenerateMnemonicModalOpen, renderGenerateMnemonicModal] = useModalState();
    const [generateMnemonicModalButton, setGenerateMnemonicModalButtonOpen, renderGenerateMnemonicModalButton] =
        useModalState();

    useSearchParamsEffect(
        (params) => {
            if (!mnemonicData.isMnemonicAvailable) {
                return;
            }

            const actionParam = params.get('action');
            if (!actionParam) {
                return;
            }

            if (actionParam === 'generate-recovery-phrase') {
                if (mnemonicData.mnemonicCanBeRegenerated) {
                    setGenerateMnemonicModalButtonOpen(true);
                } else {
                    setGenerateMnemonicModalOpen(true);
                }

                params.delete('action');
                return params;
            }
        },
        [mnemonicData.loading]
    );

    return {
        el: (
            <>
                {renderDisableMnemonicModal && <DisableMnemonicModal {...disableMnemonicModal} />}
                {renderGenerateMnemonicModalButton && (
                    <GenerateMnemonicModal
                        confirmStep
                        {...generateMnemonicModalButton}
                        onSuccess={() => sendRecoverySettingEnabled({ setting: 'recovery_phrase' })}
                    />
                )}
                {renderGenerateMnemonicModal && (
                    <GenerateMnemonicModal
                        {...generateMnemonicModal}
                        onSuccess={() => sendRecoverySettingEnabled({ setting: 'recovery_phrase' })}
                    />
                )}
            </>
        ),
        updatePhrase: () => {
            setGenerateMnemonicModalButtonOpen(true);
        },
        updateToggle: (checked: boolean) => {
            if (checked) {
                setGenerateMnemonicModalOpen(true);
            } else {
                setDisableMnemonicModalOpen(true);
            }
        },
        toggleLoading: disableMnemonicModal.open || generateMnemonicModal.open,
    };
};

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import Info from '@proton/components/components/link/Info';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import DisableMnemonicModal from '@proton/components/containers/mnemonic/DisableMnemonicModal';
import GenerateMnemonicModal from '@proton/components/containers/mnemonic/GenerateMnemonicModal';
import { useRecoverySettingsTelemetry } from '@proton/components/containers/recovery/recoverySettingsTelemetry';
import useIsMnemonicAvailable from '@proton/components/hooks/useIsMnemonicAvailable';
import useSearchParamsEffect from '@proton/components/hooks/useSearchParamsEffect';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';

const RecoveryPhraseSubSection = () => {
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const [user] = useUser();

    const [isMnemonicAvailable, loadingIsMnemonicAvailable] = useIsMnemonicAvailable();

    const [disableMnemonicModal, setDisableMnemonicModalOpen, renderDisableMnemonicModal] = useModalState();
    const [generateMnemonicModal, setGenerateMnemonicModalOpen, renderGenerateMnemonicModal] = useModalState();
    const [generateMnemonicModalButton, setGenerateMnemonicModalButtonOpen, renderGenerateMnemonicModalButton] =
        useModalState();

    useSearchParamsEffect(
        (params) => {
            if (!isMnemonicAvailable) {
                return;
            }

            const actionParam = params.get('action');
            if (!actionParam) {
                return;
            }

            if (actionParam === 'generate-recovery-phrase') {
                if (user.MnemonicStatus === MNEMONIC_STATUS.SET || user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED) {
                    setGenerateMnemonicModalButtonOpen(true);
                } else {
                    setGenerateMnemonicModalOpen(true);
                }

                params.delete('action');
                return params;
            }
        },
        [loadingIsMnemonicAvailable]
    );

    if (!isMnemonicAvailable) {
        return null;
    }

    return (
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
            <SettingsSection>
                {user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED && (
                    <p className="color-danger">
                        <IcExclamationCircleFilled className="mr-2 float-left mt-1" size={3.5} />
                        {c('Warning')
                            .t`Your recovery phrase is outdated. It can't recover new data if you reset your password again.`}
                    </p>
                )}
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label className="pt-0 mb-2 md:mb-0 text-semibold" htmlFor="mnemonicToggle">
                            <span className="mr-2">{c('label').t`Recovery phrase`}</span>
                            <Info
                                title={c('Info')
                                    .t`A recovery phrase lets you access your account and recover your encrypted messages if you forget your password`}
                            />
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight isToggleContainer={user.MnemonicStatus !== MNEMONIC_STATUS.OUTDATED}>
                        {user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED ? (
                            <Button color="norm" onClick={() => setGenerateMnemonicModalButtonOpen(true)}>
                                {c('Action').t`Update recovery phrase`}
                            </Button>
                        ) : (
                            <>
                                <div className="flex items-start">
                                    <Toggle
                                        className="mr-2"
                                        loading={disableMnemonicModal.open || generateMnemonicModal.open}
                                        checked={user.MnemonicStatus === MNEMONIC_STATUS.SET}
                                        id="mnemonicToggle"
                                        onChange={({ target: { checked } }) => {
                                            if (checked) {
                                                setGenerateMnemonicModalOpen(true);
                                            } else {
                                                setDisableMnemonicModalOpen(true);
                                            }
                                        }}
                                    />
                                    <label
                                        data-testid="account:recovery:mnemonicToggle"
                                        htmlFor="mnemonicToggle"
                                        className="flex-1 mt-0.5"
                                    >
                                        {c('Label').t`Allow recovery by recovery phrase`}
                                    </label>
                                </div>
                                {user.MnemonicStatus === MNEMONIC_STATUS.SET && (
                                    <Button
                                        className="mt-4"
                                        shape="outline"
                                        onClick={() => setGenerateMnemonicModalButtonOpen(true)}
                                    >
                                        {c('Action').t`Generate new recovery phrase`}
                                    </Button>
                                )}
                            </>
                        )}
                    </SettingsLayoutRight>
                </SettingsLayout>
            </SettingsSection>
        </>
    );
};

export default RecoveryPhraseSubSection;

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { updateDeviceRecovery } from '@proton/shared/lib/api/settingsRecovery';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';

import { Icon, Info, Toggle, useModalState } from '../../components';
import {
    useApi,
    useEventManager,
    useFeature,
    useHasOutdatedRecoveryFile,
    useIsMnemonicAvailable,
    useIsRecoveryFileAvailable,
    useRecoverySecrets,
    useSearchParamsEffect,
    useUser,
    useUserSettings,
} from '../../hooks';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import SettingsParagraph from '../account/SettingsParagraph';
import SettingsSection from '../account/SettingsSection';
import { FeatureCode } from '../features';
import { DisableMnemonicModal, GenerateMnemonicModal } from '../mnemonic';
import ExportRecoveryFileButton from './ExportRecoveryFileButton';
import VoidRecoveryFilesModal from './VoidRecoveryFilesModal';

const DataRecoverySection = () => {
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const { call } = useEventManager();
    const api = useApi();

    const trustedDeviceRecoveryFeature = useFeature<boolean>(FeatureCode.TrustedDeviceRecovery);

    const [isRecoveryFileAvailable] = useIsRecoveryFileAvailable();
    const [isMnemonicAvailable, loadingIsMnemonicAvailable] = useIsMnemonicAvailable();

    const [disableMnemonicModal, setDisableMnemonicModalOpen, renderDisableMnemonicModal] = useModalState();
    const [generateMnemonicModal, setGenerateMnemonicModalOpen, renderGenerateMnemonicModal] = useModalState();
    const [generateMnemonicModalButton, setGenerateMnemonicModalButtonOpen, renderGenerateMnemonicModalButton] =
        useModalState();
    const [generateMnemonicModalToggle, setGenerateMnemonicModalToggleOpen, renderGenerateMnemonicModalToggle] =
        useModalState();
    const [voidRecoveryFilesModal, setVoidRecoveryFilesModalOpen, renderVoidRecoveryFilesModal] = useModalState();

    const hasOutdatedRecoveryFile = useHasOutdatedRecoveryFile();
    const recoverySecrets = useRecoverySecrets();
    const canRevokeRecoveryFiles = recoverySecrets?.length > 0;

    const [loadingDeviceRecovery, withLoadingDeviceRecovery] = useLoading();

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

    const handleChangeDeviceRecoveryToggle = async (checked: boolean) => {
        await api(updateDeviceRecovery({ DeviceRecovery: Number(checked) }));
        await call();
    };

    return (
        <>
            {renderDisableMnemonicModal && <DisableMnemonicModal {...disableMnemonicModal} />}
            {renderGenerateMnemonicModalToggle && (
                <GenerateMnemonicModal confirmStep {...generateMnemonicModalToggle} />
            )}
            {renderGenerateMnemonicModalButton && (
                <GenerateMnemonicModal confirmStep {...generateMnemonicModalButton} />
            )}
            {renderGenerateMnemonicModal && <GenerateMnemonicModal {...generateMnemonicModal} />}
            {renderVoidRecoveryFilesModal && (
                <VoidRecoveryFilesModal
                    trustedDeviceRecovery={trustedDeviceRecoveryFeature.feature?.Value}
                    {...voidRecoveryFilesModal}
                />
            )}

            <SettingsSection>
                <SettingsParagraph>
                    {c('Info')
                        .t`Activate at least one data recovery method to make sure you can continue to access the contents of your ${BRAND_NAME} Account if you lose your password.`}
                    <br />
                    <Href href={getKnowledgeBaseUrl('/set-account-recovery-methods#how-to-enable-a-recovery-phrase')}>
                        {c('Link').t`Learn more about data recovery`}
                    </Href>
                </SettingsParagraph>

                {isMnemonicAvailable && (
                    <>
                        {user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED && (
                            <p className="color-danger">
                                <Icon className="mr-2 float-left mt-1" name="exclamation-circle-filled" size={14} />
                                {c('Warning')
                                    .t`Your recovery phrase is outdated. It can't recover new data if you reset your account again.`}
                            </p>
                        )}

                        <SettingsLayout>
                            <SettingsLayoutLeft>
                                <label className="pt-0 mb-2 md:mb-0 text-semibold" htmlFor="mnemonic-phrase-toggle">
                                    <span className="mr-2">{c('label').t`Recovery phrase`}</span>
                                    <Info
                                        title={c('Info')
                                            .t`A recovery phrase lets you access your account and recover your encrypted messages if you forget your password`}
                                    />
                                </label>
                            </SettingsLayoutLeft>
                            <SettingsLayoutRight className="flex-item-fluid pt-2">
                                {user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED ? (
                                    <Button color="norm" onClick={() => setGenerateMnemonicModalButtonOpen(true)}>
                                        {c('Action').t`Update recovery phrase`}
                                    </Button>
                                ) : (
                                    <>
                                        <div className="flex flex-align-items-center">
                                            <Toggle
                                                className="mr-2"
                                                loading={disableMnemonicModal.open || generateMnemonicModalToggle.open}
                                                checked={user.MnemonicStatus === MNEMONIC_STATUS.SET}
                                                id="mnemonicToggle"
                                                onChange={({ target: { checked } }) => {
                                                    if (checked) {
                                                        setGenerateMnemonicModalToggleOpen(true);
                                                    } else {
                                                        setDisableMnemonicModalOpen(true);
                                                    }
                                                }}
                                            />

                                            <label
                                                data-testid="account:recovery:mnemonicToggle"
                                                htmlFor="mnemonicToggle"
                                                className="flex-item-fluid"
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
                    </>
                )}

                {isMnemonicAvailable && isRecoveryFileAvailable && <hr className="my-8" />}

                {isRecoveryFileAvailable && (
                    <>
                        {trustedDeviceRecoveryFeature.feature?.Value && (
                            <SettingsLayout>
                                <SettingsLayoutLeft>
                                    <label className="pt-0 mb-2 md:mb-0 text-semibold" htmlFor="device-recovery-toggle">
                                        <span className="mr-2">{c('label').t`Trusted device recovery`}</span>
                                        <Info
                                            title={c('Info')
                                                .t`We securely store recovery information on your trusted device to prevent you from losing your data`}
                                        />
                                    </label>
                                </SettingsLayoutLeft>
                                <SettingsLayoutRight className="flex-item-fluid pt-2">
                                    <div className="flex flex-align-items-center">
                                        <Toggle
                                            className="mr-2"
                                            loading={loadingDeviceRecovery}
                                            checked={!!userSettings.DeviceRecovery}
                                            id="deviceRecoveryToggle"
                                            onChange={({ target: { checked } }) =>
                                                withLoadingDeviceRecovery(handleChangeDeviceRecoveryToggle(checked))
                                            }
                                        />
                                        <label
                                            htmlFor="deviceRecoveryToggle"
                                            className="flex-item-fluid"
                                            data-testid="account:recovery:trustedDevice"
                                        >
                                            {c('Label').t`Allow recovery using a trusted device`}
                                        </label>
                                    </div>
                                </SettingsLayoutRight>
                            </SettingsLayout>
                        )}
                        <SettingsLayout>
                            <SettingsLayoutLeft>
                                <label className="pt-0 mb-2 md:mb-0 text-semibold" htmlFor="recoveryFile">
                                    <span className="mr-2">{c('Title').t`Recovery file`}</span>
                                    <Info
                                        title={c('Info')
                                            .t`A recovery file lets you unlock and view your data after an account reset`}
                                    />
                                </label>
                            </SettingsLayoutLeft>
                            <SettingsLayoutRight>
                                <ExportRecoveryFileButton className="block" color="norm">
                                    {hasOutdatedRecoveryFile
                                        ? c('Action').t`Update recovery file`
                                        : c('Action').t`Download recovery file`}
                                </ExportRecoveryFileButton>
                                {canRevokeRecoveryFiles && (
                                    <Button
                                        className="mt-4"
                                        color="danger"
                                        shape="underline"
                                        onClick={() => setVoidRecoveryFilesModalOpen(true)}
                                    >
                                        {c('Action').t`Void all recovery files`}
                                    </Button>
                                )}
                            </SettingsLayoutRight>
                        </SettingsLayout>
                        {hasOutdatedRecoveryFile && (
                            <p className="color-danger">
                                <Icon className="mr-2 float-left mt-1" name="exclamation-circle-filled" size={14} />
                                {c('Warning')
                                    .t`Your recovery file is outdated. It can't recover new data if you reset your account again.`}
                            </p>
                        )}
                    </>
                )}
            </SettingsSection>
        </>
    );
};

export default DataRecoverySection;

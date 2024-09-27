import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import useIsRecoveryFileAvailable from '@proton/components/hooks/recoveryFile/useIsRecoveryFileAvailable';
import { useGetUserSettings } from '@proton/components/hooks/useUserSettings';
import { useLoading } from '@proton/hooks';
import { updateDeviceRecovery } from '@proton/shared/lib/api/settingsRecovery';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import { syncDeviceRecovery } from '@proton/shared/lib/recoveryFile/deviceRecovery';

import {
    useApi,
    useAuthentication,
    useConfig,
    useEventManager,
    useGetAddresses,
    useGetUser,
    useGetUserKeys,
    useHasOutdatedRecoveryFile,
    useIsMnemonicAvailable,
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
import DisableMnemonicModal from '../mnemonic/DisableMnemonicModal';
import GenerateMnemonicModal from '../mnemonic/GenerateMnemonicModal';
import ExportRecoveryFileButton from './ExportRecoveryFileButton';
import VoidRecoveryFilesModal from './VoidRecoveryFilesModal';

export const DataRecoverySection = () => {
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const { call } = useEventManager();
    const api = useApi();
    const { APP_NAME } = useConfig();
    const authentication = useAuthentication();

    const getUser = useGetUser();
    const getUserKeys = useGetUserKeys();
    const getAddresses = useGetAddresses();
    const getUserSettings = useGetUserSettings();
    const [isRecoveryFileAvailable] = useIsRecoveryFileAvailable();
    const [isMnemonicAvailable, loadingIsMnemonicAvailable] = useIsMnemonicAvailable();

    const [disableMnemonicModal, setDisableMnemonicModalOpen, renderDisableMnemonicModal] = useModalState();
    const [generateMnemonicModal, setGenerateMnemonicModalOpen, renderGenerateMnemonicModal] = useModalState();
    const [generateMnemonicModalButton, setGenerateMnemonicModalButtonOpen, renderGenerateMnemonicModalButton] =
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

    const syncDeviceRecoveryHelper = async (partialUserSettings: Partial<UserSettings>) => {
        const [user, userKeys, addresses, userSettings] = await Promise.all([
            getUser(),
            getUserKeys(),
            getAddresses(),
            getUserSettings(),
        ]);
        return syncDeviceRecovery({
            api,
            user,
            addresses,
            appName: APP_NAME,
            userSettings: { ...userSettings, ...partialUserSettings },
            userKeys,
            authentication,
        });
    };

    const handleChangeDeviceRecoveryToggle = async (checked: boolean) => {
        const DeviceRecovery = Number(checked) as 0 | 1;
        if (userSettings.DeviceRecovery === DeviceRecovery) {
            return;
        }
        await api(updateDeviceRecovery({ DeviceRecovery }));
        await syncDeviceRecoveryHelper({ DeviceRecovery });
        await call();
    };

    return (
        <>
            {renderDisableMnemonicModal && <DisableMnemonicModal {...disableMnemonicModal} />}
            {renderGenerateMnemonicModalButton && (
                <GenerateMnemonicModal confirmStep {...generateMnemonicModalButton} />
            )}
            {renderGenerateMnemonicModal && <GenerateMnemonicModal {...generateMnemonicModal} />}
            {renderVoidRecoveryFilesModal && (
                <VoidRecoveryFilesModal
                    onVoid={() => handleChangeDeviceRecoveryToggle(false)}
                    deviceRecoveryEnabled={Boolean(userSettings.DeviceRecovery)}
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
                                <Icon className="mr-2 float-left mt-1" name="exclamation-circle-filled" size={3.5} />
                                {c('Warning')
                                    .t`Your recovery phrase is outdated. It can't recover new data if you reset your account again.`}
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
                    </>
                )}

                {isMnemonicAvailable && isRecoveryFileAvailable && <hr className="my-8" />}

                {isRecoveryFileAvailable && (
                    <>
                        <SettingsLayout>
                            <SettingsLayoutLeft>
                                <label className="pt-0 mb-2 md:mb-0 text-semibold" htmlFor="deviceRecoveryToggle">
                                    <span className="mr-2">{c('label').t`Device-based recovery`}</span>
                                    <Info
                                        url={getKnowledgeBaseUrl('/device-data-recovery')}
                                        title={c('Info')
                                            .t`We securely store recovery information on your trusted device to prevent you from losing your data`}
                                    />
                                </label>
                            </SettingsLayoutLeft>
                            <SettingsLayoutRight isToggleContainer>
                                <div className="flex items-start">
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
                                        className="flex-1 mt-0.5"
                                        data-testid="account:recovery:trustedDevice"
                                    >
                                        {c('Label').t`Allow recovery using a trusted device`}
                                    </label>
                                </div>
                            </SettingsLayoutRight>
                        </SettingsLayout>
                        <SettingsLayout>
                            <SettingsLayoutLeft>
                                <span className="pt-0 mb-2 md:mb-0 text-semibold">
                                    <span className="mr-2">{c('Title').t`Recovery file`}</span>
                                    <Info
                                        title={c('Info')
                                            .t`A recovery file lets you unlock and view your data after an account reset`}
                                    />
                                </span>
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
                            <p className="color-danger flex flex-nowrap">
                                <Icon className="mr-2 shrink-0 mt-0.5" name="exclamation-circle-filled" size={3.5} />
                                <span className="flex-1">{c('Warning')
                                    .t`Your recovery file is outdated. It can't recover new data if you reset your account again.`}</span>
                            </p>
                        )}
                    </>
                )}
            </SettingsSection>
        </>
    );
};

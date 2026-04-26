import { c } from 'ttag';

import { selectMnemonicData } from '@proton/account/recovery/mnemonic';
import { selectRecoveryFileData } from '@proton/account/recovery/recoveryFile';
import { useUpdateMnemonicRecovery } from '@proton/account/recovery/useUpdateMnemonicRecovery';
import { useUpdateRecoveryFile } from '@proton/account/recovery/useUpdateRecoveryFile';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsDivider from '@proton/components/containers/account/SettingsDivider';
import { useLoading } from '@proton/hooks';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import SettingsParagraph from '../account/SettingsParagraph';
import SettingsSection from '../account/SettingsSection';
import ExportRecoveryFileButton from './ExportRecoveryFileButton';

export const DataRecoverySection = () => {
    const mnemonicData = useSelector(selectMnemonicData);
    const updateMnemonicRecovery = useUpdateMnemonicRecovery(mnemonicData);

    const recoveryFileData = useSelector(selectRecoveryFileData);
    const updateRecoveryFile = useUpdateRecoveryFile(recoveryFileData);

    const [loadingDeviceRecovery, withLoadingDeviceRecovery] = useLoading();

    return (
        <>
            {updateMnemonicRecovery.el}
            {updateRecoveryFile.el}

            <SettingsSection>
                <SettingsParagraph>
                    {c('Info')
                        .t`Activate at least one data recovery method to make sure you can continue to access the contents of your ${BRAND_NAME} Account if you lose your password.`}
                    <br />
                    <Href href={getKnowledgeBaseUrl('/set-account-recovery-methods#how-to-enable-a-recovery-phrase')}>
                        {c('Link').t`Learn more about data recovery`}
                    </Href>
                </SettingsParagraph>

                <SettingsDivider>
                    {mnemonicData.isMnemonicAvailable && (
                        <>
                            {mnemonicData.hasOutdatedMnemonic && (
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
                                <SettingsLayoutRight isToggleContainer={!mnemonicData.hasOutdatedMnemonic}>
                                    {mnemonicData.hasOutdatedMnemonic ? (
                                        <Button color="norm" onClick={() => updateMnemonicRecovery.updatePhrase()}>
                                            {c('Action').t`Update recovery phrase`}
                                        </Button>
                                    ) : (
                                        <>
                                            <div className="flex items-start">
                                                <Toggle
                                                    className="mr-2"
                                                    loading={updateMnemonicRecovery.toggleLoading}
                                                    checked={mnemonicData.isMnemonicSet}
                                                    id="mnemonicToggle"
                                                    onChange={({ target: { checked } }) => {
                                                        updateMnemonicRecovery.updateToggle(checked);
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

                                            {mnemonicData.isMnemonicSet && (
                                                <Button
                                                    className="mt-4"
                                                    shape="outline"
                                                    onClick={() => updateMnemonicRecovery.updatePhrase()}
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

                    {recoveryFileData.isRecoveryFileAvailable && (
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
                                            checked={recoveryFileData.hasDeviceRecoveryEnabled}
                                            id="deviceRecoveryToggle"
                                            onChange={({ target: { checked } }) =>
                                                withLoadingDeviceRecovery(
                                                    updateRecoveryFile.toggleDeviceRecovery(checked)
                                                )
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
                                                .t`A recovery file lets you unlock and view your data after account recovery`}
                                        />
                                    </span>
                                </SettingsLayoutLeft>
                                <SettingsLayoutRight>
                                    <div className="flex flex-column items-start gap-2">
                                        <ExportRecoveryFileButton className="block" color="norm">
                                            {recoveryFileData.hasOutdatedRecoveryFile
                                                ? c('Action').t`Update recovery file`
                                                : c('Action').t`Download recovery file`}
                                        </ExportRecoveryFileButton>
                                        {recoveryFileData.canRevokeRecoveryFiles && (
                                            <Button
                                                color="danger"
                                                shape="underline"
                                                onClick={() => updateRecoveryFile.voidFiles()}
                                            >
                                                {c('Action').t`Void all recovery files`}
                                            </Button>
                                        )}
                                    </div>
                                </SettingsLayoutRight>
                            </SettingsLayout>
                            {recoveryFileData.hasOutdatedRecoveryFile && (
                                <p className="color-danger flex flex-nowrap">
                                    <IcExclamationCircleFilled className="mr-2 shrink-0 mt-0.5" size={3.5} />
                                    <span className="flex-1">{c('Warning')
                                        .t`Your recovery file is outdated. It can't recover new data if you reset your password again.`}</span>
                                </p>
                            )}
                        </>
                    )}
                </SettingsDivider>
            </SettingsSection>
        </>
    );
};

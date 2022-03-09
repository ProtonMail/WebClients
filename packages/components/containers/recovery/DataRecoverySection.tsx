import { c } from 'ttag';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';

import { Button, Icon, Info, Toggle, useModalState } from '../../components';

import {
    useHasOutdatedRecoveryFile,
    useIsMnemonicAvailable,
    useIsRecoveryFileAvailable,
    useRecoverySecrets,
    useUserSettings,
    useUser,
    useSearchParamsEffect,
} from '../../hooks';

import { classnames } from '../../helpers/component';

import SettingsParagraph from '../account/SettingsParagraph';
import SettingsSection from '../account/SettingsSection';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import { GenerateMnemonicModal, DisableMnemonicModal } from '../mnemonic';

import ExportRecoveryFileButton from './ExportRecoveryFileButton';
import VoidRecoveryFilesModal from './VoidRecoveryFilesModal';

const DataRecoverySection = () => {
    const [user] = useUser();
    const [userSettings, loadingUserSettings] = useUserSettings();

    const [isRecoveryFileAvailable, loadingIsRecoveryFileAvailable] = useIsRecoveryFileAvailable();
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

    const loading =
        loadingUserSettings || !userSettings || loadingIsMnemonicAvailable || loadingIsRecoveryFileAvailable;

    useSearchParamsEffect(
        (params) => {
            if (!loading && params.get('action') === 'generate-recovery-phrase') {
                setGenerateMnemonicModalOpen(true);
                params.delete('action');
                return params;
            }
        },
        [loading]
    );

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
            {renderVoidRecoveryFilesModal && <VoidRecoveryFilesModal {...voidRecoveryFilesModal} />}

            <SettingsSection>
                <SettingsParagraph>
                    {c('Info').t`After a password reset your data is locked in encrypted form to keep it safe.`}{' '}
                    {(() => {
                        if (isMnemonicAvailable && isRecoveryFileAvailable) {
                            return c('Info')
                                .t`To decrypt and view your emails and other data, you need a recovery phrase or recovery file.`;
                        }

                        if (isMnemonicAvailable) {
                            return c('Info')
                                .t`To decrypt and view your emails and other data, you need a recovery phrase.`;
                        }

                        if (isRecoveryFileAvailable) {
                            return c('Info')
                                .t`To decrypt and view your emails and other data, you need a recovery file.`;
                        }

                        return '';
                    })()}
                </SettingsParagraph>

                {isMnemonicAvailable && (
                    <>
                        {user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED && (
                            <p className="color-danger">
                                <Icon className="mr0-5 float-left mt0-25" name="circle-exclamation-filled" size={14} />
                                {c('Warning')
                                    .t`Your recovery phrase is outdated. It can't recover new data if you reset your account again.`}
                            </p>
                        )}

                        <SettingsLayout>
                            <SettingsLayoutLeft>
                                <label className="pt0 on-mobile-mb0-5 text-semibold" htmlFor="mnemonic-phrase-toggle">
                                    <span className="mr0-5">{c('label').t`Recovery phrase`}</span>
                                    <Info
                                        title={c('Info')
                                            .t`A recovery phrase lets you access your account and recover your encrypted messages if you forget your password.`}
                                    />
                                </label>
                            </SettingsLayoutLeft>
                            <SettingsLayoutRight className="flex-item-fluid pt0-5">
                                {user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED ? (
                                    <Button color="norm" onClick={() => setGenerateMnemonicModalButtonOpen(true)}>
                                        {c('Action').t`Update recovery phrase`}
                                    </Button>
                                ) : (
                                    <>
                                        <div className="flex flex-align-items-center mb1-5">
                                            <Toggle
                                                className="mr0-5"
                                                loading={disableMnemonicModal.open || generateMnemonicModalToggle.open}
                                                checked={user.MnemonicStatus === MNEMONIC_STATUS.SET}
                                                id="passwordMnemonicResetToggle"
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
                                                htmlFor="passwordMnemonicResetToggle"
                                                className="flex-item-fluid"
                                            >
                                                {c('Label').t`Allow recovery by recovery phrase`}
                                            </label>
                                        </div>

                                        {user.MnemonicStatus === MNEMONIC_STATUS.SET && (
                                            <Button
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

                {isMnemonicAvailable && isRecoveryFileAvailable && <hr className="mb2 mt2" />}

                {isRecoveryFileAvailable && (
                    <>
                        {hasOutdatedRecoveryFile && (
                            <p className="color-danger">
                                <Icon className="mr0-5 float-left mt0-25" name="circle-exclamation-filled" size={14} />
                                {c('Warning')
                                    .t`Your recovery file is outdated. It can't recover new data if you reset your account again.`}
                            </p>
                        )}
                        <SettingsLayout>
                            <SettingsLayoutLeft>
                                <label className="pt0 on-mobile-mb0-5 text-semibold" htmlFor="recoveryFile">
                                    <span className="mr0-5">{c('Title').t`Recovery file`}</span>
                                    <Info
                                        title={c('Info')
                                            .t`A recovery file lets you unlock and view your data after an account reset. `}
                                    />
                                </label>
                            </SettingsLayoutLeft>
                            <SettingsLayoutRight>
                                <ExportRecoveryFileButton
                                    className={classnames(['mr1-5', canRevokeRecoveryFiles && 'mb1'])}
                                    color="norm"
                                >
                                    {hasOutdatedRecoveryFile
                                        ? c('Action').t`Update recovery file`
                                        : c('Action').t`Download recovery file`}
                                </ExportRecoveryFileButton>
                                {canRevokeRecoveryFiles && (
                                    <Button
                                        className="mb1"
                                        color="danger"
                                        shape="underline"
                                        onClick={() => setVoidRecoveryFilesModalOpen(true)}
                                        loading={loading}
                                    >
                                        {c('Action').t`Void all recovery files`}
                                    </Button>
                                )}
                            </SettingsLayoutRight>
                        </SettingsLayout>
                    </>
                )}
            </SettingsSection>
        </>
    );
};

export default DataRecoverySection;

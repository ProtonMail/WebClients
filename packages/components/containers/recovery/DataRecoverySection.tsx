import { useEffect, useRef } from 'react';
import { c } from 'ttag';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';

import { Button, Icon, Info, Loader, Toggle } from '../../components';

import {
    useEventManager,
    useHasOutdatedRecoveryFile,
    useIsMnemonicAvailable,
    useLoading,
    useModals,
    useRecoverySecrets,
    useUserSettings,
    useUser,
} from '../../hooks';

import SettingsParagraph from '../account/SettingsParagraph';
import { SettingsSection } from '../account';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import { GenerateMnemonicModal, DisableMnemonicModal } from '../mnemonic';
import useIsRecoveryFileAvailable from '../../hooks/useIsRecoveryFileAvailable';
import ExportRecoveryFileButton from './ExportRecoveryFileButton';
import VoidRecoveryFilesButton from './VoidRecoveryFilesButton';
import { classnames } from '../../helpers/component';

interface Props {
    openMnemonicModal?: boolean;
}

const DataRecoverySection = ({ openMnemonicModal = false }: Props) => {
    const [user] = useUser();
    const { createModal } = useModals();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const { call } = useEventManager();
    const shownGenerateMnemonicModal = useRef<boolean>(false);

    const [isRecoveryFileAvailable, loadingIsRecoveryFileAvailable] = useIsRecoveryFileAvailable();
    const [isMnemonicAvailable, loadingIsMnemonicAvailable] = useIsMnemonicAvailable();

    const [loadingMnemonic, withLoadingMnemonic] = useLoading();

    const hasOutdatedRecoveryFile = useHasOutdatedRecoveryFile();
    const recoverySecrets = useRecoverySecrets();
    const canRevokeRecoveryFiles = recoverySecrets?.length > 0;

    const loading =
        loadingUserSettings || !userSettings || loadingIsMnemonicAvailable || loadingIsRecoveryFileAvailable;

    const openGenerateMnemonicModal = async () => {
        await new Promise<void>((resolve, reject) => {
            createModal(<GenerateMnemonicModal onClose={reject} onSuccess={resolve} confirmStep />);
        });
        await call();
    };

    useEffect(() => {
        if (openMnemonicModal && !loading && !shownGenerateMnemonicModal.current) {
            shownGenerateMnemonicModal.current = true;
            void openGenerateMnemonicModal();
        }
    }, [loading, openMnemonicModal, shownGenerateMnemonicModal.current]);

    if (loading) {
        return <Loader />;
    }

    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .t`After a password reset your data is locked in encrypted form to keep it safe. To decrypt and view your emails and other data, you need a recovery file or recovery phrase.`}
            </SettingsParagraph>

            {isRecoveryFileAvailable && (
                <>
                    {hasOutdatedRecoveryFile && (
                        <p className="color-danger">
                            <Icon className="mr0-5 float-left mt0-25" name="circle-exclamation-filled" size={14} />
                            {c('Warning')
                                .t`Your recovery file is outdated and can't recover new data should you reset your account again.`}
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
                                <VoidRecoveryFilesButton className="mb1" color="danger" shape="link" />
                            )}
                        </SettingsLayoutRight>
                    </SettingsLayout>
                </>
            )}

            {isMnemonicAvailable && (
                <>
                    <hr className="mb2 mt2" />

                    {user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED && (
                        <p className="color-danger">
                            <Icon className="mr0-5 float-left mt0-25" name="circle-exclamation-filled" size={14} />
                            {c('Warning')
                                .t`Your recovery phrase is outdated and can't recover new data should you reset your account again.`}
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
                                <Button color="norm" onClick={openGenerateMnemonicModal}>
                                    {c('Action').t`Update recovery phrase`}
                                </Button>
                            ) : (
                                <>
                                    <div className="flex flex-align-items-center mb1-5">
                                        <Toggle
                                            className="mr0-5"
                                            loading={loadingMnemonic}
                                            checked={user.MnemonicStatus === MNEMONIC_STATUS.SET}
                                            id="passwordMnemonicResetToggle"
                                            onChange={({ target: { checked } }) => {
                                                const handleMnemonicToggle = async (willBeChecked: boolean) => {
                                                    await new Promise<void>((resolve, reject) => {
                                                        if (willBeChecked) {
                                                            createModal(
                                                                <GenerateMnemonicModal
                                                                    onClose={reject}
                                                                    onSuccess={resolve}
                                                                />
                                                            );
                                                        } else {
                                                            createModal(
                                                                <DisableMnemonicModal
                                                                    onClose={reject}
                                                                    onSuccess={resolve}
                                                                />
                                                            );
                                                        }
                                                    });
                                                    await call();
                                                };

                                                return withLoadingMnemonic(handleMnemonicToggle(checked));
                                            }}
                                        />
                                        <label htmlFor="passwordMnemonicResetToggle" className="flex-item-fluid">
                                            {c('Label').t`Allow recovery by recovery phrase`}
                                        </label>
                                    </div>

                                    {user.MnemonicStatus === MNEMONIC_STATUS.SET && (
                                        <Button shape="outline" onClick={openGenerateMnemonicModal}>
                                            {c('Action').t`Generate new recovery phrase`}
                                        </Button>
                                    )}
                                </>
                            )}
                        </SettingsLayoutRight>
                    </SettingsLayout>
                </>
            )}
        </SettingsSection>
    );
};

export default DataRecoverySection;

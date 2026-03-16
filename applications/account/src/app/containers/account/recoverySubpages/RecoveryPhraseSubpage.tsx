import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SettingsDescription, {
    SettingsDescriptionItem,
} from '@proton/components/containers/account/SettingsDescription';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import DisableMnemonicModal from '@proton/components/containers/mnemonic/DisableMnemonicModal';
import GenerateMnemonicModal from '@proton/components/containers/mnemonic/GenerateMnemonicModal';
import { useRecoverySettingsTelemetry } from '@proton/components/containers/recovery/recoverySettingsTelemetry';
import useIsMnemonicAvailable from '@proton/components/hooks/useIsMnemonicAvailable';
import useSearchParamsEffect from '@proton/components/hooks/useSearchParamsEffect';
import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';

import illustration from './assets/recovery-phrase.svg';

const RecoveryPhraseSubpage = () => {
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

    const learnMoreLink = <Href key="learn" href={getKnowledgeBaseUrl('/')}>{c('Link').t`Learn more`}</Href>;

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

            <DashboardGrid>
                <SettingsDescription
                    left={
                        <>
                            <SettingsDescriptionItem>
                                {c('Info')
                                    .t`Your recovery phrase—contained in your Recovery Kit—will allow you to sign in and recover your data if you get locked out of your ${BRAND_NAME} Account. It’s is composed of 12 words and acts like a backup password.`}
                            </SettingsDescriptionItem>
                            <SettingsDescriptionItem>
                                {c('Info')
                                    .t`It’s the only way to instantly recover everything, so make sure you keep it somewhere safe but accessible.`}{' '}
                                {learnMoreLink}
                            </SettingsDescriptionItem>
                        </>
                    }
                    right={
                        <img src={illustration} alt="" className="shrink-0 hidden md:block" width={80} height={80} />
                    }
                />

                {user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED && (
                    <Banner variant="danger">
                        {c('Warning')
                            .t`Your recovery phrase is outdated. It can't recover new data if you reset your password again.`}
                    </Banner>
                )}

                <DashboardCard>
                    <DashboardCardContent>
                        <h3 className="mb-0 text-rg text-semibold mb-2">{c('Title').t`Your recovery phrase`}</h3>

                        {(user.MnemonicStatus === MNEMONIC_STATUS.DISABLED ||
                            user.MnemonicStatus === MNEMONIC_STATUS.ENABLED ||
                            user.MnemonicStatus === MNEMONIC_STATUS.PROMPT) && (
                            <div>
                                <Button
                                    color="norm"
                                    onClick={() => setGenerateMnemonicModalButtonOpen(true)}
                                    className="inline-flex gap-2 items-center"
                                >
                                    <IcPlus className="shrink-0" />
                                    {c('Action').t`Create recovery phrase`}
                                </Button>
                            </div>
                        )}

                        {user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED && (
                            <div>
                                <Button
                                    color="norm"
                                    className="inline-flex gap-2 items-center"
                                    onClick={() => setGenerateMnemonicModalButtonOpen(true)}
                                >
                                    <IcArrowRotateRight className="shrink-0" />
                                    {c('Action').t`Generate new phrase`}
                                </Button>
                            </div>
                        )}

                        {user.MnemonicStatus === MNEMONIC_STATUS.SET && (
                            <div>
                                <Button
                                    shape="outline"
                                    className="color-primary inline-flex gap-2 items-center"
                                    onClick={() => setGenerateMnemonicModalButtonOpen(true)}
                                >
                                    <IcArrowRotateRight className="shrink-0" />
                                    {c('Action').t`Generate new recovery phrase`}
                                </Button>
                            </div>
                        )}

                        <DashboardCardDivider />
                        <SettingsToggleRow
                            id="mnemonicToggle"
                            label={
                                <>
                                    <SettingsToggleRow.Label data-testid="account:recovery:mnemonicToggle">
                                        {c('Label').t`Allow recovery by recovery phrase`}
                                    </SettingsToggleRow.Label>
                                    <SettingsToggleRow.Description>
                                        {c('Info')
                                            .t`We strongly recommend that everyone enable recovery by recovery phrase.`}
                                    </SettingsToggleRow.Description>
                                </>
                            }
                            toggle={
                                <SettingsToggleRow.Toggle
                                    loading={disableMnemonicModal.open || generateMnemonicModal.open}
                                    checked={user.MnemonicStatus === MNEMONIC_STATUS.SET}
                                    onChange={({ target: { checked } }) => {
                                        if (checked) {
                                            setGenerateMnemonicModalOpen(true);
                                        } else {
                                            setDisableMnemonicModalOpen(true);
                                        }
                                    }}
                                />
                            }
                        />
                    </DashboardCardContent>
                </DashboardCard>
            </DashboardGrid>
        </>
    );
};

export default RecoveryPhraseSubpage;

import { c } from 'ttag';

import { selectMnemonicData } from '@proton/account/recovery/mnemonic';
import { useUpdateMnemonicRecovery } from '@proton/account/recovery/useUpdateMnemonicRecovery';
import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import SettingsDescription, {
    SettingsDescriptionItem,
} from '@proton/components/containers/account/SettingsDescription';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import illustration from './assets/recovery-phrase.svg';

const RecoveryPhraseSubpage = () => {
    const mnemonicData = useSelector(selectMnemonicData);
    const updateMnemonicRecovery = useUpdateMnemonicRecovery(mnemonicData);

    if (!mnemonicData.isMnemonicAvailable) {
        return null;
    }

    const learnMoreLink = (
        <Href key="learn" href={getKnowledgeBaseUrl('/recovery-phrase')}>{c('Link').t`Learn more`}</Href>
    );

    return (
        <>
            {updateMnemonicRecovery.el}
            <DashboardGrid>
                <SettingsDescription
                    left={
                        <>
                            <SettingsDescriptionItem>
                                {c('Info')
                                    .t`Your recovery phrase—contained in your Recovery Kit—will allow you to sign in and recover your data if you get locked out of your ${BRAND_NAME} Account. It is composed of 12 words and acts like a backup password.`}
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

                {mnemonicData.hasOutdatedMnemonic && (
                    <Banner variant="danger">
                        {c('Warning')
                            .t`Your recovery phrase is outdated. It can't recover new data if you reset your password again.`}
                    </Banner>
                )}

                <DashboardCard>
                    <DashboardCardContent>
                        <h3 className="mb-0 text-rg text-semibold mb-2">{c('Title').t`Your recovery phrase`}</h3>

                        {mnemonicData.createMnemonic && (
                            <div>
                                <Button
                                    color="norm"
                                    onClick={() => updateMnemonicRecovery.updatePhrase()}
                                    className="inline-flex gap-2 items-center"
                                >
                                    <IcPlus className="shrink-0" />
                                    {c('Action').t`Create recovery phrase`}
                                </Button>
                            </div>
                        )}

                        {mnemonicData.hasOutdatedMnemonic && (
                            <div>
                                <Button
                                    color="norm"
                                    className="inline-flex gap-2 items-center"
                                    onClick={() => updateMnemonicRecovery.updatePhrase()}
                                >
                                    <IcArrowRotateRight className="shrink-0" />
                                    {c('Action').t`Generate new phrase`}
                                </Button>
                            </div>
                        )}

                        {mnemonicData.isMnemonicSet && (
                            <div>
                                <Button
                                    shape="outline"
                                    className="color-primary inline-flex gap-2 items-center"
                                    onClick={() => updateMnemonicRecovery.updatePhrase()}
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
                                    loading={updateMnemonicRecovery.toggleLoading}
                                    checked={mnemonicData.isMnemonicSet}
                                    onChange={({ target: { checked } }) => {
                                        updateMnemonicRecovery.updateToggle(checked);
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

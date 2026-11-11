import { useState } from 'react';

import { c } from 'ttag';

import { useIsSentinelUser } from '@proton/account/recovery/sentinelHooks';
import { useUpdateAccountRecovery } from '@proton/account/recovery/useUpdateAccountRecovery';
import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import Loader from '@proton/components/components/loader/Loader';
import SettingsDescription from '@proton/components/containers/account/SettingsDescription';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import { StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import { LastChanged } from '@proton/components/containers/recovery/LastChanged';
import { RecoveryFieldForm } from '@proton/components/containers/recovery/RecoveryFieldForm';
import RecoveryPhone from '@proton/components/containers/recovery/phone/RecoveryPhone';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useMyCountry from '@proton/components/hooks/useMyCountry';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import darkIllustration from './assets/recovery-phone-dark.svg';
import illustration from './assets/recovery-phone.svg';
import SentinelBadge from './shared/SentinelBadge';

const RecoveryPhoneSubpage = () => {
    const theme = useTheme();
    const isDarkTheme = theme.information.dark;
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();
    const [maybeIsEditingRecoveryPhone, setIsEditingRecoveryPhone] = useState(false);
    const defaultCountry = useMyCountry();
    const accountRecovery = useUpdateAccountRecovery();

    const { phoneRecovery, loading } = accountRecovery.data;

    if (loading || loadingIsSentinelUser) {
        return <Loader />;
    }

    // Handles the case where a user focuses the input and clears the value, gets the confirmation modal, and clicks confirm.
    // The change happens outside of the onSubmit handler, so this is an extra guard against that.
    const isEditingRecoveryPhoneAndHasValue = maybeIsEditingRecoveryPhone && !!phoneRecovery.value;

    return (
        <>
            {accountRecovery.el}
            <DashboardGrid>
                <SettingsDescription
                    right={
                        <img
                            src={isDarkTheme ? darkIllustration : illustration}
                            alt=""
                            className="shrink-0 hidden md:block"
                            width={80}
                            height={80}
                        />
                    }
                >
                    <SettingsDescription.Item>
                        {c('Info')
                            .t`We can use your recovery phone to send you a verification code to reset your password, and to contact you if we notice suspicious activity.`}
                    </SettingsDescription.Item>
                    <SettingsDescription.Item>
                        {getBoldFormattedText(
                            c('Info')
                                .t`**Your recovery phone alone doesn’t allow you to recover your encrypted data** after you reset your password.`
                        )}{' '}
                        <Href key="learn" href={getKnowledgeBaseUrl('/email-sms-recovery')}>{c('Link')
                            .t`Learn more`}</Href>
                    </SettingsDescription.Item>
                </SettingsDescription>
                <DashboardCard>
                    <DashboardCardContent>
                        <RecoveryPhone
                            defaultCountry={defaultCountry}
                            disableVerifyCta
                            {...accountRecovery.recoveryPhone.props}
                            onSubmit={async (value) => {
                                try {
                                    await accountRecovery.recoveryPhone.handleChangePhoneValue({
                                        value,
                                        autoStartVerificationFlowAfterSet: true,
                                    });
                                    setIsEditingRecoveryPhone(false);
                                } catch {}
                            }}
                            inputProps={{
                                label: c('Label').t`Your recovery phone number`,
                                readOnly: !isEditingRecoveryPhoneAndHasValue && !!phoneRecovery.value,
                                onFocus: () => {
                                    if (!phoneRecovery.value) {
                                        return;
                                    }
                                    setIsEditingRecoveryPhone(true);
                                },
                            }}
                            renderForm={(formProps) => (
                                <RecoveryFieldForm
                                    {...formProps}
                                    value={phoneRecovery.value}
                                    isVerified={phoneRecovery.isVerified}
                                    isEditing={isEditingRecoveryPhoneAndHasValue}
                                    onEdit={() => setIsEditingRecoveryPhone(true)}
                                    onKeep={() => {
                                        formProps.onReset();
                                        setIsEditingRecoveryPhone(false);
                                    }}
                                />
                            )}
                        />

                        {!!phoneRecovery.value && (
                            <div className="fade-in">
                                <DashboardCardDivider />
                                <SettingsToggleRow
                                    id="passwordPhoneResetToggle"
                                    label={
                                        <>
                                            <SettingsToggleRow.Label>
                                                {c('Label').t`Allow recovery by phone`}
                                            </SettingsToggleRow.Label>
                                            <SettingsToggleRow.Description>
                                                {c('Info')
                                                    .t`If disabled, ${BRAND_NAME} will still use your recovery phone to send security notifications.`}
                                            </SettingsToggleRow.Description>
                                        </>
                                    }
                                    toggle={
                                        <SettingsToggleRow.Toggle
                                            {...accountRecovery.recoveryPhone.toggleProps}
                                            /* Overridden for new design */
                                            checked={phoneRecovery.hasReset}
                                        />
                                    }
                                />
                            </div>
                        )}
                        {isSentinelUser && !phoneRecovery.value && (
                            <SentinelBadge
                                className="mt-6"
                                status={StatusBadgeStatus.Warning}
                                text={c('Info').t`Add a phone number in case we need to contact you`}
                            />
                        )}

                        {isSentinelUser && phoneRecovery.value && phoneRecovery.hasReset && (
                            <SentinelBadge
                                className="mt-6"
                                status={StatusBadgeStatus.Danger}
                                text={c('Info')
                                    .t`To ensure the highest possible security of your account, disable **Recovery by phone**.`}
                            />
                        )}

                        {isSentinelUser && phoneRecovery.value && !phoneRecovery.hasReset && (
                            <SentinelBadge
                                className="mt-6"
                                status={StatusBadgeStatus.Success}
                                text={c('Info')
                                    .t`To ensure the highest possible security of your account, keep **Recovery by phone** disabled.`}
                            />
                        )}
                    </DashboardCardContent>
                </DashboardCard>
                <LastChanged
                    className="block mt-2"
                    date={phoneRecovery.updateTime}
                    data-testid="account:recovery:recovery-phone:last-changed-date"
                />
            </DashboardGrid>
        </>
    );
};

export default RecoveryPhoneSubpage;

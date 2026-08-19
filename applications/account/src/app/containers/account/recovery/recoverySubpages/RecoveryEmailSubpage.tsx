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
import { LastChanged } from '@proton/components/containers/recovery/LastChanged';
import { RecoveryFieldForm } from '@proton/components/containers/recovery/RecoveryFieldForm';
import RecoveryEmail from '@proton/components/containers/recovery/email/RecoveryEmail';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { IcShieldExclamationFilled } from '@proton/icons/icons/IcShieldExclamationFilled';
import { BRAND_NAME, PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import darkIllustration from './assets/recovery-email-dark.svg';
import illustration from './assets/recovery-email.svg';
import SentinelWarning from './shared/SentinelWarning';

const RecoveryEmailSubpage = () => {
    const theme = useTheme();
    const isDarkTheme = theme.information.dark;
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();
    const [maybeIsEditingRecoveryEmail, setIsEditingRecoveryEmail] = useState(false);
    const accountRecovery = useUpdateAccountRecovery();

    const { emailRecovery, loading } = accountRecovery.data;

    if (loading || loadingIsSentinelUser) {
        return <Loader />;
    }

    // Handles the case where a user focuses the input and clears the value, gets the confirmation modal, and clicks confirm.
    // The change happens outside of the onSubmit handler, so this is an extra guard against that.
    const isEditingEmailAndHasValue = maybeIsEditingRecoveryEmail && !!emailRecovery.value;

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
                            .t`We can use your recovery email to send you a verification code to reset your password, and to contact you if we notice suspicious activity.`}
                    </SettingsDescription.Item>
                    <SettingsDescription.Item>
                        {getBoldFormattedText(
                            c('Info')
                                .t`**Your recovery email alone doesn't allow you to recover your encrypted data** after you reset your password.`
                        )}{' '}
                        <Href key="learn" href={getKnowledgeBaseUrl('/email-sms-recovery')}>{c('Link')
                            .t`Learn more`}</Href>
                    </SettingsDescription.Item>
                </SettingsDescription>
                <DashboardCard>
                    <DashboardCardContent>
                        <RecoveryEmail
                            disableVerifyCta
                            {...accountRecovery.recoveryEmail.props}
                            onSubmit={async (value) => {
                                try {
                                    await accountRecovery.recoveryEmail.handleChangeEmailValue({
                                        value,
                                        autoStartVerificationFlowAfterSet: true,
                                    });
                                    setIsEditingRecoveryEmail(false);
                                } catch {}
                            }}
                            inputProps={{
                                label: c('Label').t`Your recovery email`,
                                readOnly: !isEditingEmailAndHasValue && !!emailRecovery.value,
                                placeholder: c('Placeholder').t`example@domain.com`,
                                onFocus: () => {
                                    if (!emailRecovery.value) {
                                        return;
                                    }
                                    setIsEditingRecoveryEmail(true);
                                },
                            }}
                            renderForm={(formProps) => (
                                <RecoveryFieldForm
                                    {...formProps}
                                    value={emailRecovery.value}
                                    isVerified={emailRecovery.isVerified}
                                    isEditing={isEditingEmailAndHasValue}
                                    onEdit={() => setIsEditingRecoveryEmail(true)}
                                    onKeep={() => {
                                        formProps.onReset();
                                        setIsEditingRecoveryEmail(false);
                                    }}
                                />
                            )}
                        />

                        {!!emailRecovery.value && (
                            <div className="fade-in">
                                <DashboardCardDivider />
                                <SettingsToggleRow
                                    id="passwordEmailResetToggle"
                                    label={
                                        <>
                                            <SettingsToggleRow.Label>
                                                {c('Label').t`Allow recovery by email`}
                                                {isSentinelUser && (
                                                    <IcShieldExclamationFilled className="color-warning shrink-0" />
                                                )}
                                            </SettingsToggleRow.Label>
                                            <SettingsToggleRow.Description>
                                                {isSentinelUser
                                                    ? c('Info')
                                                          .t`Recovery by email is not available while ${PROTON_SENTINEL_NAME} is enabled.`
                                                    : c('Info')
                                                          .t`If disabled, ${BRAND_NAME} will still use your recovery email to send security notifications.`}
                                            </SettingsToggleRow.Description>
                                        </>
                                    }
                                    toggle={
                                        <SettingsToggleRow.Toggle
                                            disabled={!emailRecovery.hasReset && isSentinelUser}
                                            {...accountRecovery.recoveryEmail.toggleProps}
                                            /* Overridden for new design */
                                            checked={emailRecovery.hasReset}
                                        />
                                    }
                                />
                            </div>
                        )}

                        {emailRecovery.value && emailRecovery.hasReset && isSentinelUser && (
                            <SentinelWarning
                                text={c('Info')
                                    .t`To ensure the highest possible security of your account, disable **Recovery by recovery email**.`}
                            />
                        )}
                        {!emailRecovery.value && isSentinelUser && (
                            <SentinelWarning text={c('Info').t`Add an email address in case we need to contact you`} />
                        )}
                    </DashboardCardContent>
                </DashboardCard>
                <LastChanged
                    className="block mt-2"
                    date={emailRecovery.updateTime}
                    data-testid="account:recovery:recovery-email:last-changed-date"
                />
            </DashboardGrid>
        </>
    );
};

export default RecoveryEmailSubpage;

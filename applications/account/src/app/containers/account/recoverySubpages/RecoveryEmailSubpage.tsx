import type { ComponentPropsWithoutRef } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { useIsSentinelUser } from '@proton/account/recovery/sentinelHooks';
import { useUpdateAccountRecovery } from '@proton/account/recovery/useUpdateAccountRecovery';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Loader from '@proton/components/components/loader/Loader';
import SettingsDescription, {
    SettingsDescriptionItem,
} from '@proton/components/containers/account/SettingsDescription';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import RecoveryEmail from '@proton/components/containers/recovery/email/RecoveryEmail';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { IcPen } from '@proton/icons/icons/IcPen';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcShieldExclamationFilled } from '@proton/icons/icons/IcShieldExclamationFilled';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { BRAND_NAME, PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import illustration from './assets/recovery-email.svg';
import SentinelWarning from './shared/SentinelWarning';

interface RecoveryEmailInputRowProps {
    input: React.ReactNode;
    emailValue: string;
    isEditing: boolean;
    onEdit: () => void;
    onRemove: () => void;
}

const RecoveryEmailInputRow = ({ input, emailValue, isEditing, onEdit, onRemove }: RecoveryEmailInputRowProps) => (
    <div className="flex items-center gap-2 mb-2 flex-nowrap">
        <div className="w-full max-w-custom fade-in" style={{ '--max-w-custom': '25rem' }}>
            {input}
        </div>
        {!!emailValue && !isEditing && (
            <div className="flex flex-nowrap shrink-0">
                <Tooltip title={c('Action').t`Edit`}>
                    <Button
                        shape="ghost"
                        type="button"
                        size="small"
                        icon
                        onClick={(event) => {
                            event.preventDefault();
                            onEdit();
                        }}
                    >
                        <IcPen alt={c('Action').t`Edit`} />
                    </Button>
                </Tooltip>
                <Tooltip title={c('Action').t`Remove`}>
                    <Button
                        shape="ghost"
                        type="button"
                        size="small"
                        icon
                        onClick={(event) => {
                            event.preventDefault();
                            onRemove();
                        }}
                    >
                        <IcTrash alt={c('Action').t`Remove`} />
                    </Button>
                </Tooltip>
            </div>
        )}
    </div>
);

interface RecoveryEmailInputActionsProps {
    submitButtonProps: ComponentPropsWithoutRef<typeof Button>;
    emailValue: string;
    isEditing: boolean;
    onKeep: () => void;
}

const RecoveryEmailInputActions = ({
    submitButtonProps,
    emailValue,
    isEditing,
    onKeep,
}: RecoveryEmailInputActionsProps) => {
    if (emailValue && !isEditing) {
        return null;
    }
    return (
        <div className="flex items-center gap-2">
            {isEditing ? (
                <>
                    <Button className="inline-flex items-center gap-1" color="norm" {...submitButtonProps}>
                        {c('Action').t`Save and verify`}
                    </Button>
                    <Button shape="ghost" color="norm" onClick={onKeep}>
                        {c('Action').t`Keep`}
                    </Button>
                </>
            ) : (
                <Button className="inline-flex items-center gap-1" color="norm" {...submitButtonProps}>
                    <IcPlus /> {c('Action').t`Add and verify`}
                </Button>
            )}
        </div>
    );
};

interface RecoveryEmailVerificationStatusProps {
    emailValue: string;
    isEditing: boolean;
    isVerified: boolean;
    onVerify: () => void;
}

const RecoveryEmailVerificationStatus = ({
    emailValue,
    isEditing,
    isVerified,
    onVerify,
}: RecoveryEmailVerificationStatusProps) => {
    if (!emailValue || isEditing) {
        return null;
    }
    return isVerified ? (
        <StatusBadge status={StatusBadgeStatus.Success} text={c('Status').t`Verified`} />
    ) : (
        <div className="flex items-center gap-2">
            <StatusBadge status={StatusBadgeStatus.Warning} text={c('Status').t`Unverified`} />
            <Button shape="ghost" color="norm" size="small" type="button" onClick={onVerify}>
                {c('Action').t`Verify`}
            </Button>
        </div>
    );
};

const RecoveryEmailSubpage = () => {
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();
    const [isEditingRecoveryEmail, setIsEditingRecoveryEmail] = useState(false);
    const accountRecovery = useUpdateAccountRecovery();

    const { emailRecovery, loading } = accountRecovery.data;

    if (loading || loadingIsSentinelUser) {
        return <Loader />;
    }

    const learnMoreLink = <Href key="learn" href={getKnowledgeBaseUrl('/')}>{c('Link').t`Learn more`}</Href>;

    return (
        <>
            {accountRecovery.el}
            <DashboardGrid>
                <SettingsDescription
                    left={
                        <>
                            <SettingsDescriptionItem>
                                {c('Info')
                                    .t`We can use your recovery email to send you a verification code to reset your password, and to contact you if we notice suspicious activity.`}
                            </SettingsDescriptionItem>
                            <SettingsDescriptionItem>
                                {getBoldFormattedText(
                                    c('Info')
                                        .t`**Your recovery email alone doesn't allow you to recover your encrypted data** after you reset your password.`
                                )}{' '}
                                {learnMoreLink}
                            </SettingsDescriptionItem>
                        </>
                    }
                    right={
                        <img src={illustration} alt="" className="shrink-0 hidden md:block" width={80} height={80} />
                    }
                />
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
                                } finally {
                                    setIsEditingRecoveryEmail(false);
                                }
                            }}
                            inputProps={{
                                label: c('Label').t`Your recovery email`,
                                readOnly: !isEditingRecoveryEmail && !!emailRecovery.value,
                                placeholder: c('Placeholder').t`example@domain.com`,
                            }}
                            renderForm={({ onSubmit, onReset, input, submitButtonProps, onVerify, onRemove }) => {
                                return (
                                    <form onSubmit={onSubmit}>
                                        <RecoveryEmailInputRow
                                            input={input}
                                            emailValue={emailRecovery.value}
                                            isEditing={isEditingRecoveryEmail}
                                            onEdit={() => setIsEditingRecoveryEmail(true)}
                                            onRemove={onRemove}
                                        />
                                        <RecoveryEmailInputActions
                                            submitButtonProps={submitButtonProps}
                                            emailValue={emailRecovery.value}
                                            isEditing={isEditingRecoveryEmail}
                                            onKeep={() => {
                                                onReset();
                                                setIsEditingRecoveryEmail(false);
                                            }}
                                        />
                                        <RecoveryEmailVerificationStatus
                                            emailValue={emailRecovery.value}
                                            isEditing={isEditingRecoveryEmail}
                                            isVerified={emailRecovery.isVerified}
                                            onVerify={onVerify}
                                        />
                                    </form>
                                );
                            }}
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

                        {emailRecovery.enabled && isSentinelUser && (
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
            </DashboardGrid>
        </>
    );
};

export default RecoveryEmailSubpage;

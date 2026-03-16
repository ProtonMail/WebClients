import type { ComponentPropsWithoutRef } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { RecoveryMethodWarningModal } from '@proton/account/delegatedAccess/recoveryContact/RecoveryMethodWarningModal';
import { getCanDisableRecovery } from '@proton/account/delegatedAccess/recoveryContact/getCanDisableRecovery';
import { useOutgoingItems } from '@proton/account/delegatedAccess/shared/outgoing/useOutgoingItems';
import { userSettingsThunk } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import SettingsDescription, {
    SettingsDescriptionItem,
} from '@proton/components/containers/account/SettingsDescription';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import AuthModal from '@proton/components/containers/password/AuthModal';
import type { AuthModalResult } from '@proton/components/containers/password/interface';
import RecoveryPhone from '@proton/components/containers/recovery/phone/RecoveryPhone';
import { useRecoverySettingsTelemetry } from '@proton/components/containers/recovery/recoverySettingsTelemetry';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useIsSentinelUser from '@proton/components/hooks/useIsSentinelUser';
import useMyCountry from '@proton/components/hooks/useMyCountry';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { IcPen } from '@proton/icons/icons/IcPen';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcShieldExclamationFilled } from '@proton/icons/icons/IcShieldExclamationFilled';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { updateResetPhone } from '@proton/shared/lib/api/settings';
import { BRAND_NAME, PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { SETTINGS_STATUS } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import illustration from './assets/recovery-phone.svg';
import SentinelWarning from './shared/SentinelWarning';

interface RecoveryPhoneInputRowProps {
    input: React.ReactNode;
    phoneValue: string;
    isEditing: boolean;
    onEdit: () => void;
    onRemove: () => void;
}

const RecoveryPhoneInputRow = ({ input, phoneValue, isEditing, onEdit, onRemove }: RecoveryPhoneInputRowProps) => (
    <div className="flex items-center gap-2 mb-2 flex-nowrap">
        <div className="w-full max-w-custom fade-in" style={{ '--max-w-custom': '25rem' }}>
            {input}
        </div>
        {!!phoneValue && !isEditing && (
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

interface RecoveryPhoneInputActionsProps {
    submitButtonProps: ComponentPropsWithoutRef<typeof Button>;
    phoneValue: string;
    isEditing: boolean;
    onKeep: () => void;
}

const RecoveryPhoneInputActions = ({
    submitButtonProps,
    phoneValue,
    isEditing,
    onKeep,
}: RecoveryPhoneInputActionsProps) => {
    if (phoneValue && !isEditing) {
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

interface RecoveryPhoneVerificationStatusProps {
    phoneValue: string;
    isEditing: boolean;
    isVerified: boolean;
    onVerify: () => void;
}

const RecoveryPhoneVerificationStatus = ({
    phoneValue,
    isEditing,
    isVerified,
    onVerify,
}: RecoveryPhoneVerificationStatusProps) => {
    if (!phoneValue || isEditing) {
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

const RecoveryPhoneSubpage = () => {
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();
    const [isEditingRecoveryPhone, setIsEditingRecoveryPhone] = useState(false);
    const dispatch = useDispatch();
    const [loadingPhoneReset, withLoadingPhoneReset] = useLoading();
    const { createNotification } = useNotifications();
    const defaultCountry = useMyCountry();
    const [authModal, showAuthModal] = useModalTwoPromise<{ config: any }, AuthModalResult>();
    const outgoingItems = useOutgoingItems();
    const canDisableRecovery = getCanDisableRecovery({
        recoveryContacts: outgoingItems.items.recoveryContacts,
        userSettings,
    });
    const [renderProps, showRecoveryContactWarning, renderModal] = useModalState();

    if (loadingUserSettings || loadingIsSentinelUser) {
        return <Loader />;
    }

    const handleChangePasswordPhoneToggle = async (value: number) => {
        if (value && !userSettings.Phone.Value) {
            return createNotification({
                type: 'error',
                text: c('Error').t`Please set a recovery phone number first`,
            });
        }
        await showAuthModal({ config: updateResetPhone({ Reset: value }) });
        await dispatch(userSettingsThunk({ cache: CacheType.None }));
        if (value) {
            sendRecoverySettingEnabled({ setting: 'recovery_by_phone' });
        }
    };

    const learnMoreLink = <Href key="learn" href={getKnowledgeBaseUrl('/')}>{c('Link').t`Learn more`}</Href>;

    return (
        <>
            {authModal(({ onResolve, onReject, ...props }) => (
                <AuthModal {...props} scope="password" onCancel={onReject} onSuccess={onResolve} />
            ))}
            {renderModal && <RecoveryMethodWarningModal {...renderProps} />}
            <DashboardGrid>
                <SettingsDescription
                    left={
                        <>
                            <SettingsDescriptionItem>
                                {c('Info')
                                    .t`We can use your recovery phone to send you a verification code to reset your password, and to contact you if we notice suspicious activity.`}
                            </SettingsDescriptionItem>
                            <SettingsDescriptionItem>
                                {getBoldFormattedText(
                                    c('Info')
                                        .t`**Your recovery phone alone doesn’t allow you to recover your encrypted data** after you reset your password.`
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
                        <RecoveryPhone
                            defaultCountry={defaultCountry}
                            disableVerifyCta
                            autoStartVerificationFlowAfterSet
                            phone={userSettings.Phone}
                            hasReset={!!userSettings.Phone.Reset}
                            canSubmit={(value) => {
                                if (!value && !canDisableRecovery.canDisablePhone) {
                                    showRecoveryContactWarning(true);
                                    return false;
                                }
                                return true;
                            }}
                            onSuccess={(updatedUserSettings) => {
                                if (!!updatedUserSettings.Phone.Reset && !!updatedUserSettings.Phone.Value) {
                                    sendRecoverySettingEnabled({ setting: 'recovery_by_phone' });
                                }
                                setIsEditingRecoveryPhone(false);
                            }}
                            inputProps={{
                                label: c('Label').t`Your recovery phone number`,
                                readOnly: !isEditingRecoveryPhone && !!userSettings.Phone.Value,
                            }}
                            renderForm={({ onSubmit, onReset, input, submitButtonProps, onVerify, onRemove }) => {
                                return (
                                    <form onSubmit={onSubmit}>
                                        <RecoveryPhoneInputRow
                                            input={input}
                                            phoneValue={userSettings.Phone.Value}
                                            isEditing={isEditingRecoveryPhone}
                                            onEdit={() => setIsEditingRecoveryPhone(true)}
                                            onRemove={onRemove}
                                        />
                                        <RecoveryPhoneInputActions
                                            submitButtonProps={submitButtonProps}
                                            phoneValue={userSettings.Phone.Value}
                                            isEditing={isEditingRecoveryPhone}
                                            onKeep={() => {
                                                onReset();
                                                setIsEditingRecoveryPhone(false);
                                            }}
                                        />
                                        <RecoveryPhoneVerificationStatus
                                            phoneValue={userSettings.Phone.Value}
                                            isEditing={isEditingRecoveryPhone}
                                            isVerified={userSettings.Phone.Status === SETTINGS_STATUS.VERIFIED}
                                            onVerify={onVerify}
                                        />
                                    </form>
                                );
                            }}
                        />

                        {!!userSettings.Phone.Value && (
                            <div className="fade-in">
                                <DashboardCardDivider />
                                <SettingsToggleRow
                                    id="passwordPhoneResetToggle"
                                    label={
                                        <>
                                            <SettingsToggleRow.Label>
                                                {c('Label').t`Allow recovery by phone`}
                                                {isSentinelUser && (
                                                    <IcShieldExclamationFilled className="color-warning shrink-0" />
                                                )}
                                            </SettingsToggleRow.Label>
                                            <SettingsToggleRow.Description>
                                                {isSentinelUser
                                                    ? c('Info')
                                                          .t`Recovery by phone is not available while ${PROTON_SENTINEL_NAME} is enabled.`
                                                    : c('Info')
                                                          .t`If disabled, ${BRAND_NAME} will still use your recovery phone to send security notifications.`}
                                            </SettingsToggleRow.Description>
                                        </>
                                    }
                                    toggle={
                                        <SettingsToggleRow.Toggle
                                            loading={loadingPhoneReset}
                                            checked={!!userSettings.Phone.Reset && !!userSettings.Phone.Value}
                                            disabled={!userSettings.Phone.Reset && isSentinelUser}
                                            onChange={({ target: { checked } }) => {
                                                if (!checked && !canDisableRecovery.canDisablePhone) {
                                                    showRecoveryContactWarning(true);
                                                    return;
                                                }
                                                return withLoadingPhoneReset(
                                                    handleChangePasswordPhoneToggle(+checked).catch(noop)
                                                );
                                            }}
                                        />
                                    }
                                />
                            </div>
                        )}

                        {!!userSettings.Phone.Reset && !!userSettings.Phone.Value && isSentinelUser && (
                            <SentinelWarning
                                text={c('Info')
                                    .t`To ensure the highest possible security of your account, disable **Recovery by recovery phone**.`}
                            />
                        )}
                        {!userSettings.Phone.Value && isSentinelUser && (
                            <SentinelWarning text={c('Info').t`Add a phone number in case we need to contact you`} />
                        )}
                    </DashboardCardContent>
                </DashboardCard>
            </DashboardGrid>
        </>
    );
};

export default RecoveryPhoneSubpage;

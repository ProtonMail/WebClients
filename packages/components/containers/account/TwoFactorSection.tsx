import { useState } from 'react';

import { c, msgid } from 'ttag';

import { selectAvailableRecoveryMethods } from '@proton/account/recovery/sessionRecoverySelectors';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { Pill } from '@proton/atoms/Pill/Pill';
import useLoading from '@proton/hooks/useLoading';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { IcPen } from '@proton/icons/icons/IcPen';
import { IcPinCode } from '@proton/icons/icons/IcPinCode';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcSecurityKey } from '@proton/icons/icons/IcSecurityKey';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { useDispatch, useSelector } from '@proton/redux-shared-store/sharedProvider';
import { getHasFIDO2Support } from '@proton/shared/lib/authentication/twoFactor';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { FIDO2_CREDENTIALS_PIN_VALUE } from '@proton/shared/lib/interfaces';
import { getHasFIDO2SettingEnabled, getHasTOTPSettingEnabled } from '@proton/shared/lib/settings/twoFactor';
import { getHasWebAuthnSupport } from '@proton/shared/lib/webauthn/helper';
import { getId } from '@proton/shared/lib/webauthn/id';
import { Fido2CredentialFlags } from '@proton/shared/lib/webauthn/interface';

import { ButtonGroup } from '../../components/button/ButtonGroup';
import useModalState from '../../components/modalTwo/useModalState';
import useConfig from '../../hooks/useConfig';
import useErrorHandler from '../../hooks/useErrorHandler';
import useNotifications from '../../hooks/useNotifications';
import LostTwoFAModal from './LostTwoFAModal';
import { SettingsIconRow } from './SettingsIconRow';
import { SettingsToggleRow } from './SettingsToggleRow';
import AuthenticatorPromotionBanner from './authenticatorPromotion/AuthenticatorPromotionBanner';
import AddSecurityKeyModal from './fido/AddSecurityKeyModal';
import EditSecurityKeyModal from './fido/EditSecurityKeyModal';
import RemoveSecurityKeyModal from './fido/RemoveSecurityKeyModal';
import { maxSecurityKeyLength } from './fido/constants';
import { setSecurityKeyRequirePinFlag } from './fido/setSecurityKeyRequirePinFlag';
import DisableTOTPModal from './totp/DisableTOTPModal';
import EnableTOTPModal from './totp/EnableTOTPModal';
import { getSecurityKeySigningWarning } from './totp/getSecurityKeySigningWarning';

const defaultTmpRemove = { keys: [], type: 'all' as const };

const TwoFactorSection = () => {
    const dispatch = useDispatch();
    const { APP_NAME } = useConfig();
    const [userSettings] = useUserSettings();
    const { createNotification } = useNotifications();
    const handleError = useErrorHandler();
    const [loading, withLoading] = useLoading();
    const [enableTOTPModal, setEnableTOTPModalOpen, renderEnableTOTPModal] = useModalState();
    const [disableTOTPModal, setDisableTOTPModalOpen, renderDisableTOTPModal] = useModalState();
    const [lostTwoFAPModal, setLostTwoFAModal, renderLostTwoFAModal] = useModalState();
    const [addSecurityKeyModal, setAddSecurityKeyModal, renderAddSecurityKeyModal] = useModalState();
    const [removeSecurityKeyModal, setRemoveSecurityKeyModal, renderRemoveSecurityKeyModal] = useModalState();
    const [editSecurityKeyModal, setEditSecurityKeyModal, renderEditSecurityKeyModal] = useModalState();
    const [tmpRemove, setTmpRemove] = useState<{ keys: { name: string; id: string }[]; type: 'all' | 'single' }>(
        defaultTmpRemove
    );
    const [tmpEdit, setTmpEdit] = useState<{ name: string; id: string } | undefined>(undefined);

    const hasTOTPEnabled = getHasTOTPSettingEnabled(userSettings);
    const hasFIDO2Enabled = getHasFIDO2SettingEnabled(userSettings);

    const registeredKeys = userSettings['2FA']?.RegisteredKeys || [];

    const { availableRecoveryMethods, hasRecoveryMethod } = useSelector(selectAvailableRecoveryMethods);

    const handleChangeTOTP = () => {
        if (hasTOTPEnabled) {
            setDisableTOTPModalOpen(true);
        } else {
            setEnableTOTPModalOpen(true);
        }
    };

    const handleChangeKey = () => {
        const keys = registeredKeys.map((RegisteredKey) => ({ id: getId(RegisteredKey), name: RegisteredKey.Name }));
        if (hasFIDO2Enabled && keys.length) {
            setTmpRemove({ keys, type: 'all' });
            setRemoveSecurityKeyModal(true);
            return;
        }
        setAddSecurityKeyModal(true);
    };

    const handleSecurityKeyRequirePinToggle = async (value: boolean) => {
        try {
            await dispatch(setSecurityKeyRequirePinFlag(value));

            createNotification({
                type: 'info',
                text: value
                    ? c('fido2: Info').t`PIN requirement for security keys enabled`
                    : c('fido2: Info').t`PIN requirement for security keys disabled`,
            });
        } catch (e) {
            handleError(e);
        }
    };

    const twoFactorAuthLink =
        APP_NAME === APPS.PROTONVPN_SETTINGS
            ? 'https://protonvpn.com/support/two-factor-authentication'
            : getKnowledgeBaseUrl('/two-factor-authentication-2fa');

    const hasSecurityKeySupport =
        getHasWebAuthnSupport() && getHasFIDO2Support({ appName: APP_NAME, hostname: location.hostname });

    return (
        <DashboardGrid>
            {renderEnableTOTPModal && <EnableTOTPModal {...enableTOTPModal} />}
            {renderDisableTOTPModal && <DisableTOTPModal {...disableTOTPModal} />}
            {renderLostTwoFAModal && (
                <LostTwoFAModal availableRecoveryMethods={availableRecoveryMethods} {...lostTwoFAPModal} />
            )}
            <DashboardGridSectionHeader
                title={c('Title').t`Two-factor authentication`}
                subtitle={
                    <>
                        {c('Info')
                            .jt`Add another layer of security to your account. You’ll need to verify yourself with 2FA every time you sign in.`}{' '}
                        <Href href={twoFactorAuthLink}>{c('Info').t`Learn more`}</Href>
                        {(hasTOTPEnabled || hasFIDO2Enabled) && hasRecoveryMethod && (
                            <>
                                <br />
                                <InlineLinkButton onClick={() => setLostTwoFAModal(true)}>
                                    {c('Action').t`Lost access to your 2FA device?`}
                                </InlineLinkButton>
                            </>
                        )}
                    </>
                }
            />
            <DashboardCard>
                <DashboardCardContent>
                    <SettingsIconRow icon={IcPinCode}>
                        <SettingsToggleRow
                            id="twoFactorToggle"
                            label={
                                <>
                                    <SettingsToggleRow.Label>{c('Label').t`Authenticator app`}</SettingsToggleRow.Label>
                                    <SettingsToggleRow.Description>
                                        {c('Info')
                                            .t`Verify your identity with a time-based one-time password from an authenticator app`}
                                    </SettingsToggleRow.Description>
                                </>
                            }
                            toggle={<SettingsToggleRow.Toggle checked={hasTOTPEnabled} onChange={handleChangeTOTP} />}
                        />
                    </SettingsIconRow>
                    {hasSecurityKeySupport && (
                        <>
                            <DashboardCardDivider />
                            <SettingsIconRow icon={IcSecurityKey}>
                                <SettingsToggleRow
                                    id="twoFactorKeyToggle"
                                    label={
                                        <>
                                            <SettingsToggleRow.Label>{c('fido2: Info')
                                                .t`Security key`}</SettingsToggleRow.Label>
                                            <SettingsToggleRow.Description>
                                                {c('fido2: Info')
                                                    .t`Verify your identity with a physical U2F or FIDO2 security key`}
                                            </SettingsToggleRow.Description>
                                        </>
                                    }
                                    toggle={
                                        <SettingsToggleRow.Toggle
                                            checked={hasFIDO2Enabled}
                                            onChange={handleChangeKey}
                                        />
                                    }
                                />
                            </SettingsIconRow>
                            {registeredKeys.length > 0 && (
                                <>
                                    <DashboardCardDivider />
                                    <SettingsIconRow icon={IcPinCode}>
                                        <SettingsToggleRow
                                            id="requireSecurityKey"
                                            label={
                                                <>
                                                    <SettingsToggleRow.Label>{c('fido2: Info')
                                                        .t`Require PIN for security key`}</SettingsToggleRow.Label>
                                                    <SettingsToggleRow.Description>
                                                        {c('fido2: Info')
                                                            .t`Enter your PIN each time you use your security key with ${BRAND_NAME}, when the key supports it. This only applies to keys that have a PIN set up.`}
                                                    </SettingsToggleRow.Description>
                                                </>
                                            }
                                            toggle={
                                                <SettingsToggleRow.Toggle
                                                    loading={loading}
                                                    checked={
                                                        userSettings.Flags.Fido2CredentialsPinOptIn ===
                                                        FIDO2_CREDENTIALS_PIN_VALUE.ENABLED
                                                    }
                                                    onChange={({ target: { checked } }) =>
                                                        withLoading(handleSecurityKeyRequirePinToggle(checked))
                                                    }
                                                />
                                            }
                                        />
                                    </SettingsIconRow>
                                </>
                            )}
                        </>
                    )}
                </DashboardCardContent>
            </DashboardCard>
            {hasFIDO2Enabled && !hasTOTPEnabled && (
                <Banner variant={BannerVariants.WARNING_OUTLINE}>{getSecurityKeySigningWarning()}</Banner>
            )}
            {hasSecurityKeySupport && (
                <>
                    {renderAddSecurityKeyModal && <AddSecurityKeyModal {...addSecurityKeyModal} />}
                    {renderRemoveSecurityKeyModal && tmpRemove.keys.length && (
                        <RemoveSecurityKeyModal
                            keys={tmpRemove.keys}
                            type={tmpRemove.type}
                            {...removeSecurityKeyModal}
                            onExit={() => {
                                removeSecurityKeyModal.onExit();
                                setTmpRemove(defaultTmpRemove);
                            }}
                        />
                    )}
                    {renderEditSecurityKeyModal && tmpEdit && (
                        <EditSecurityKeyModal
                            id={tmpEdit.id}
                            name={tmpEdit.name}
                            {...editSecurityKeyModal}
                            onExit={() => {
                                editSecurityKeyModal.onExit();
                                setTmpEdit(undefined);
                            }}
                        />
                    )}
                    {registeredKeys.length > 0 && (
                        <DashboardCard>
                            <DashboardCardContent>
                                <div>
                                    {registeredKeys.length < maxSecurityKeyLength ? (
                                        <Button
                                            onClick={() => {
                                                setAddSecurityKeyModal(true);
                                            }}
                                            className="flex flex-nowrap items-center"
                                        >
                                            <IcPlus className="mr-2" />
                                            {c('fido2: Action').t`New security key`}
                                        </Button>
                                    ) : (
                                        <div className="flex gap-2 items-center flex-nowrap rounded bg-weak border p-2">
                                            <IcInfoCircle size={4} className="shrink-0" />
                                            <p className="m-0">
                                                {c('fido2: Info').ngettext(
                                                    msgid`You've reached the maximum of ${maxSecurityKeyLength} security key.`,
                                                    `You've reached the maximum of ${maxSecurityKeyLength} security keys.`,
                                                    maxSecurityKeyLength
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 w-full">
                                    <div className="pb-2 border-bottom">
                                        <span className="text-bold">{c('fido2: Title').t`Security keys`} </span>
                                        <span className="color-weak">
                                            ({registeredKeys.length}/{maxSecurityKeyLength})
                                        </span>
                                    </div>
                                    {registeredKeys.map((registeredKey) => {
                                        const id = getId(registeredKey);
                                        const isCompromised = hasBit(
                                            registeredKey.Flags,
                                            Fido2CredentialFlags.Compromised
                                        );
                                        return (
                                            <div
                                                key={id}
                                                className="flex items-center py-2 gap-2 border-bottom"
                                                data-testid="fido2:security-key"
                                            >
                                                <div className="flex-1 text-break items-center">
                                                    <span>{registeredKey.Name}</span>
                                                    {isCompromised && (
                                                        <Pill
                                                            color="#5C3700"
                                                            backgroundColor="#F5D4A2"
                                                            rounded="rounded-sm"
                                                            className="ml-2 text-semibold text-center"
                                                        >{c('Info').t`Compromised`}</Pill>
                                                    )}
                                                </div>
                                                <ButtonGroup size="small">
                                                    <Button
                                                        icon
                                                        data-testid="fido2:edit-key"
                                                        onClick={() => {
                                                            setTmpEdit({
                                                                id,
                                                                name: registeredKey.Name,
                                                            });
                                                            setEditSecurityKeyModal(true);
                                                        }}
                                                    >
                                                        <IcPen />
                                                    </Button>
                                                    <Button
                                                        icon
                                                        data-testid="fido2:delete-key"
                                                        onClick={() => {
                                                            setTmpRemove({
                                                                keys: [{ id, name: registeredKey.Name }],
                                                                type: 'single',
                                                            });
                                                            setRemoveSecurityKeyModal(true);
                                                        }}
                                                    >
                                                        <IcTrash />
                                                    </Button>
                                                </ButtonGroup>
                                            </div>
                                        );
                                    })}
                                </div>
                            </DashboardCardContent>
                        </DashboardCard>
                    )}
                </>
            )}

            <AuthenticatorPromotionBanner flowId="2fa-settings" />
        </DashboardGrid>
    );
};

export default TwoFactorSection;

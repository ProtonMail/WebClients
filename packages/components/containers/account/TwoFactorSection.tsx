import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { APPS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { getHasFIDO2SettingEnabled, getHasTOTPSettingEnabled } from '@proton/shared/lib/settings/twoFactor';
import { getHasFIDO2Support } from '@proton/shared/lib/webauthn/helper';
import { getId } from '@proton/shared/lib/webauthn/id';
import clsx from '@proton/utils/clsx';

import { ButtonGroup, Icon, Info, Toggle, Tooltip, useModalState } from '../../components';
import { useConfig, useNotifications, useUserSettings } from '../../hooks';
import SettingsLayout from './SettingsLayout';
import SettingsLayoutLeft from './SettingsLayoutLeft';
import SettingsLayoutRight from './SettingsLayoutRight';
import SettingsParagraph from './SettingsParagraph';
import SettingsSection from './SettingsSection';
import AddSecurityKeyModal from './fido/AddSecurityKeyModal';
import EditSecurityKeyModal from './fido/EditSecurityKeyModal';
import RemoveSecurityKeyModal from './fido/RemoveSecurityKeyModal';
import { maxSecurityKeyLength } from './fido/constants';
import DisableTOTPModal from './totp/DisableTOTPModal';
import EnableTOTPModal from './totp/EnableTOTPModal';

const defaultTmpRemove = { keys: [], type: 'all' as const };

const TwoFactorSection = () => {
    const { APP_NAME } = useConfig();
    const [userSettings] = useUserSettings();
    const { createNotification } = useNotifications();
    const [enableTOTPModal, setEnableTOTPModalOpen, renderEnableTOTPModal] = useModalState();
    const [disableTOTPModal, setDisableTOTPModalOpen, renderDisableTOTPModal] = useModalState();
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
    const canEnableFido2 = hasTOTPEnabled;

    const canDisableTOTP = hasTOTPEnabled && !registeredKeys.length;

    const handleChangeTOTP = () => {
        if (hasTOTPEnabled) {
            if (!canDisableTOTP) {
                createNotification({
                    text: c('fido2: Error').t`Please disable 2FA via security key before disabling TOTP`,
                    type: 'error',
                });
                return;
            }
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

    const twoFactorAuthLink =
        APP_NAME === APPS.PROTONVPN_SETTINGS
            ? 'https://protonvpn.com/support/two-factor-authentication'
            : getKnowledgeBaseUrl('/two-factor-authentication-2fa');

    const hasSecurityKeySupport = getHasFIDO2Support(APP_NAME, location.hostname);

    return (
        <SettingsSection>
            {renderEnableTOTPModal && <EnableTOTPModal {...enableTOTPModal} />}
            {renderDisableTOTPModal && <DisableTOTPModal {...disableTOTPModal} />}
            <SettingsParagraph>
                {c('Info')
                    .t`Add another layer of security to your account. You’ll need to verify yourself with 2FA every time you sign in.`}
            </SettingsParagraph>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="twoFactorToggle" className="text-semibold">
                        <span className="mr-2">{c('Label').t`Authenticator app`}</span>
                        <Info
                            url={twoFactorAuthLink}
                            title={c('Info')
                                .t`Verify your identity with a time-based one-time password from an authenticator app`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt-2">
                    <Toggle checked={hasTOTPEnabled} id="twoFactorToggle" onChange={handleChangeTOTP} />
                </SettingsLayoutRight>
            </SettingsLayout>
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
                    <SettingsLayout>
                        <SettingsLayoutLeft>
                            <label htmlFor="twoFactorKeyToggle" className="text-semibold">
                                <span className={clsx(['mr-2', !canEnableFido2 && 'color-weak'])}>
                                    {c('fido2: Info').t`Security key`}
                                </span>
                                <Info
                                    url={twoFactorAuthLink}
                                    title={c('fido2: Info')
                                        .t`Verify your identity with a physical U2F or FIDO2 security key`}
                                />
                            </label>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight className="pt-2">
                            <Tooltip
                                title={
                                    !canEnableFido2
                                        ? c('fido2: Info')
                                              .t`To turn on 2FA via security key, you'll need to activate 2FA via authenticator app`
                                        : ''
                                }
                            >
                                <span className="inline-flex">
                                    <Toggle
                                        checked={hasFIDO2Enabled}
                                        id="twoFactorKeyToggle"
                                        onChange={handleChangeKey}
                                        disabled={!canEnableFido2}
                                    />
                                </span>
                            </Tooltip>
                        </SettingsLayoutRight>
                    </SettingsLayout>
                    {registeredKeys.length > 0 && (
                        <div className="mb-4">
                            <div>
                                <Button
                                    disabled={registeredKeys.length >= maxSecurityKeyLength}
                                    onClick={() => {
                                        setAddSecurityKeyModal(true);
                                    }}
                                    className="flex flex-nowrap flex-align-items-center"
                                >
                                    <Icon name="plus" className="mr-2" />
                                    {c('fido2: Action').t`Add security key`}
                                </Button>
                            </div>
                            <div className="mt-4 w-full">
                                <div className="text-bold pb-2 border-bottom">
                                    {c('fido2: Title').t`Registered security keys`}
                                </div>
                                {registeredKeys.map((registeredKey) => {
                                    const id = getId(registeredKey);
                                    return (
                                        <div key={id} className="flex flex-align-items-center py-2 border-bottom">
                                            <div className="flex-item-fluid text-break mr-2">{registeredKey.Name}</div>
                                            <ButtonGroup size="small">
                                                <Button
                                                    icon
                                                    onClick={() => {
                                                        setTmpEdit({
                                                            id,
                                                            name: registeredKey.Name,
                                                        });
                                                        setEditSecurityKeyModal(true);
                                                    }}
                                                >
                                                    <Icon name="pen" />
                                                </Button>
                                                <Button
                                                    icon
                                                    onClick={() => {
                                                        setTmpRemove({
                                                            keys: [{ id, name: registeredKey.Name }],
                                                            type: 'single',
                                                        });
                                                        setRemoveSecurityKeyModal(true);
                                                    }}
                                                >
                                                    <Icon name="trash" />
                                                </Button>
                                            </ButtonGroup>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </SettingsSection>
    );
};

export default TwoFactorSection;

import type { FC } from 'react';

import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import Toggle from '@proton/components/components/toggle/Toggle';
import { InputField as InputFieldTwo } from '@proton/components/components/v2/field/InputField';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import type { OrganizationGetResponse } from '../../../types/api/pass';
import { OrganizationVaultCreateMode } from '../../../types/api/pass';
import type { OrganizationSettings } from '../../../types/data/organization';
import { BitField } from '../../../types/forms/fields';
import type { Maybe } from '../../../types/utils';
import { PassLockSelector } from './PassLockSelector';

import './PassPolicies.scss';

type GetPoliciesProps = {
    showStoreTotp: boolean;
    showStorePasskey: boolean;
};

type PolicyItem = {
    setting: keyof OrganizationSettings;
    label: string;
    description?: string;
    /** If true, then if the UI shows the toggle as enabled, it means it's disabled BE side (BitField.DISABLED) */
    isBooleanInverted?: boolean;
};

const getVaultCreateOptions = () => [
    { value: OrganizationVaultCreateMode.ALLOWED, title: c('Label').t`Yes` },
    {
        value: OrganizationVaultCreateMode.ONLYORGADMINSANDPERSONALVAULT,
        title: c('Label').t`Only a single personal vault can be created`,
    },
    {
        value: OrganizationVaultCreateMode.ONLYORGADMINS,
        title: c('Label').t`No (users cannot use the app until a vault is shared with them)`,
    },
];

const getPolicies = ({ showStoreTotp, showStorePasskey }: GetPoliciesProps): PolicyItem[] => [
    {
        setting: 'ShareMode',
        label: c('Label').t`Allow sharing outside the organization`,
        description: c('Info')
            .t`If disabled, organization members will only be able to share vaults or items within the organization.`,
        isBooleanInverted: true,
    },
    {
        setting: 'ItemShareMode',
        label: c('Label').t`Allow individual item sharing`,
        description: c('Info')
            .t`If enabled, organization members will be able to share individual items in addition to vaults.`,
    } as const,
    {
        setting: 'PublicLinkMode',
        label: c('Label').t`Allow secure link sharing`,
        description: c('Info')
            .t`If disabled, organization members won't be able to create secure links. Previously active secure links remain valid until their expiration.`,
    } as const,
    {
        setting: 'ExportMode',
        label: c('Label').t`Allow data export for all users`,
        description: c('Info').t`If disabled, only administrators will be able to export data.`,
        isBooleanInverted: true,
    } as const,
    {
        setting: 'AliasCreateMode',
        label: c('Label').t`Allow alias creation`,
        description: c('Info')
            .t`If disabled, organization members won't be able to create new aliases. Existing aliases will remain active.`,
        isBooleanInverted: true,
    } as const,
    ...(showStoreTotp
        ? [
              {
                  setting: 'CanStoreTotp',
                  label: c('Label').t`Allow storing 2FA codes`,
                  description: c('Info')
                      .t`If disabled, organization members won't be able to add 2FA codes to their items, and existing ones won't be generated or autofilled. Nothing is deleted.`,
                  isBooleanInverted: true,
              } as const,
          ]
        : []),
    ...(showStorePasskey
        ? [
              {
                  setting: 'CanStorePasskey',
                  label: c('Label').t`Allow storing passkeys`,
                  description: c('Info')
                      .t`If disabled, organization members won't be able to save passkeys in ${PASS_APP_NAME} or sign in with them. Nothing is deleted.`,
                  isBooleanInverted: true,
              } as const,
          ]
        : []),
];

type Props = {
    organizationSettings: OrganizationGetResponse;
    loading: boolean;
    touchedSetting: Maybe<keyof OrganizationSettings>;
    onSettingChange: <K extends keyof OrganizationSettings>(setting: K, value: OrganizationSettings[K]) => void;
};

/** Sharing, export, alias, vault creation and lock policies. */
export const PassPermissionsPolicies: FC<Props> = ({
    organizationSettings,
    loading,
    touchedSetting,
    onSettingChange,
}) => {
    const showStoreTotp = useFlag('PassPolicyStoreTotp');
    const showStorePasskey = useFlag('PassPolicyStorePasskey');
    const policies = getPolicies({ showStoreTotp, showStorePasskey });

    const isPolicyBooleanInverted = (setting: keyof OrganizationSettings) =>
        policies.find((policy) => policy.setting === setting)?.isBooleanInverted;

    const handleToggle = (checked: boolean, setting: keyof OrganizationSettings) => {
        const isBooleanInverted = isPolicyBooleanInverted(setting);
        const enabled = isBooleanInverted ? BitField.DISABLED : BitField.ACTIVE;
        const disabled = isBooleanInverted ? BitField.ACTIVE : BitField.DISABLED;
        onSettingChange(setting, checked ? enabled : disabled);
    };

    return (
        <>
            {policies.map(({ setting, label, description }) => (
                <SettingsLayout key={setting} className="pb-4">
                    <SettingsLayoutLeft className="pass-policy-label">
                        <label htmlFor={`${setting}-toggle`}>
                            <div className="text-semibold">{label}</div>
                            {description && <div className="color-weak text-sm mr-2">{description}</div>}
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight isToggleContainer>
                        <Toggle
                            checked={
                                isPolicyBooleanInverted(setting)
                                    ? organizationSettings.Settings?.[setting] === BitField.DISABLED
                                    : organizationSettings.Settings?.[setting] === BitField.ACTIVE
                            }
                            id={`${setting}-toggle`}
                            onChange={({ target }) => handleToggle(target.checked, setting)}
                            disabled={loading || !organizationSettings.CanUpdate}
                            loading={touchedSetting === setting && loading}
                        />
                    </SettingsLayoutRight>
                </SettingsLayout>
            ))}
            <SettingsLayout className="pb-4">
                <SettingsLayoutLeft className="pass-policy-label">
                    <label htmlFor="pass-vault-creation" id="label-pass-vault-creation">
                        <div className="text-semibold">{c('Label').t`Allow all users to create vaults`}</div>
                        <div className="color-weak text-sm mr-2">
                            {c('Info')
                                .t`Control whether organization members can create vaults or require an administrator to create and share a vault with them.`}
                        </div>
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <InputFieldTwo
                        as={SelectTwo<number>}
                        id="pass-vault-creation"
                        placeholder={c('Label').t`Yes`}
                        onValue={(value: OrganizationVaultCreateMode) => onSettingChange('VaultCreateMode', value)}
                        value={organizationSettings.Settings?.VaultCreateMode}
                        dense
                    >
                        {getVaultCreateOptions().map(({ title, value }) => (
                            <Option key={value} title={title} value={value} />
                        ))}
                    </InputFieldTwo>
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout className="pb-4">
                <SettingsLayoutLeft className="pass-policy-label">
                    <label htmlFor="pass-lock-select" id="label-pass-lock-select">
                        <div className="text-semibold">{c('Label').t`Lock app after inactivity`}</div>
                        <div className="color-weak text-sm mr-2">
                            {c('Info')
                                .t`Organization members will need to unlock ${PASS_APP_NAME} with their password or PIN etc.`}
                        </div>
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <PassLockSelector
                        value={organizationSettings?.Settings?.ForceLockSeconds}
                        disabled={loading || !organizationSettings.CanUpdate}
                        onChange={(ttl) => onSettingChange('ForceLockSeconds', ttl)}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};

import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { PassLockSelector } from '@proton/components/containers/pass/PassLockSelector';
import { PauseList } from '@proton/components/containers/pass/pauseList/PauseListPolicy';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { usePassBridge } from '@proton/pass/lib/bridge/PassBridgeProvider';
import type { OrganizationGetResponse, OrganizationUpdatePasswordPolicyRequest } from '@proton/pass/types';
import { BitField, type Maybe } from '@proton/pass/types';
import type { OrganizationSettings } from '@proton/pass/types/data/organization';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';

import GenericError from '../error/GenericError';
import SubSettingsSection from '../layout/SubSettingsSection';
import { PasswordGeneratorPolicyForm } from '../pass/PasswordGeneratorPolicyForm';

import './PassPolicies.scss';

type GetPoliciesProps = {
    showVaultCreation: boolean;
    showItemSharing: boolean;
};
type PolicyItem = {
    setting: keyof OrganizationSettings;
    label: string;
    description?: string;
    /** If true, then if the UI shows the toggle as enabled, it means it's disabled BE side (BitField.DISABLED) */
    isBooleanInverted?: boolean;
};

const getPolicies = ({ showVaultCreation = false, showItemSharing = false }: GetPoliciesProps): PolicyItem[] => [
    {
        setting: 'ShareMode',
        label: c('Label').t`Allow sharing outside the organization`,
        description: c('Info')
            .t`If disabled, organization members will only be able to share vaults or items within the organization.`,
        isBooleanInverted: true,
    },
    ...(showItemSharing
        ? [
              {
                  setting: 'ItemShareMode',
                  label: c('Label').t`Allow individual item sharing`,
                  description: c('Info')
                      .t`If enabled, organization members will be able to share individual items in addition to vaults.`,
              } as const,
          ]
        : []),
    {
        setting: 'ExportMode',
        label: c('Label').t`Allow data export for all users`,
        description: c('Info').t`If disabled, only administrators will be able to export data.`,
        isBooleanInverted: true,
    },
    ...(showVaultCreation
        ? [
              {
                  setting: 'VaultCreateMode',
                  label: c('Label').t`Allow all users to create vaults`,
                  description: c('Info')
                      .t`If disabled, new organization members will require an admin to manually create the first vault for them (via sharing) so they can start to create items.`,
                  isBooleanInverted: true,
              } as const,
          ]
        : []),
];

const PassPolicies = () => {
    const { organization } = usePassBridge();
    const [loading, withLoading] = useLoading(true);
    const { createNotification } = useNotifications();
    const handleError = useErrorHandler();

    const showPasswordGenerator = useFlag('PassB2BPasswordGenerator');
    const showVaultCreation = useFlag('PassB2BVaultCreation');
    const showItemSharing = useFlag('PassB2BItemSharing');
    const showPauseList = useFlag('PassB2BPauseList');
    const [organizationSettings, setOrganizationSettings] = useState<Maybe<OrganizationGetResponse>>();

    const policies = getPolicies({ showVaultCreation, showItemSharing });

    const touched = useRef<keyof OrganizationSettings>();
    const didLoad = useRef(false);

    useEffect(() => {
        const fetchOrganizationSettings = () =>
            organization.settings.get().then((settings) => {
                setOrganizationSettings(settings);
                didLoad.current = true;
            });

        withLoading(fetchOrganizationSettings()).catch(handleError);
    }, []);

    const isPolicyBooleanInverted = (setting: keyof OrganizationSettings) =>
        policies.find((policy) => policy.setting === setting)?.isBooleanInverted;

    const handleToggle = async (checked: boolean, setting: keyof OrganizationSettings) => {
        touched.current = setting;
        const isBooleanInverted = isPolicyBooleanInverted(setting);

        const value = (() => {
            switch (checked) {
                case true:
                    return isBooleanInverted ? BitField.DISABLED : BitField.ACTIVE;
                case false:
                default:
                    return isBooleanInverted ? BitField.ACTIVE : BitField.DISABLED;
            }
        })();

        withLoading(
            organization.settings.set(setting, value).then((orgSettings) => {
                setOrganizationSettings(orgSettings);
                createNotification({ text: c('Info').t`Setting successfully saved` });
            })
        ).catch(handleError);
    };

    const handleLockChange = async (ttl: number) => {
        touched.current = 'ForceLockSeconds';
        withLoading(
            organization.settings.set('ForceLockSeconds', ttl).then((orgSettings) => {
                setOrganizationSettings(orgSettings);
                createNotification({ text: c('Info').t`Setting successfully saved` });
            })
        ).catch(handleError);
    };

    const handleSubmitPasswordGenerator = async (config: OrganizationUpdatePasswordPolicyRequest) => {
        withLoading(
            organization.settings.setPasswordGeneratorPolicy(config).then((orgSettings) => {
                setOrganizationSettings(orgSettings);
                createNotification({ text: c('Info').t`Password generator rules successfully saved` });
            })
        ).catch(handleError);
    };

    return (
        <>
            <SettingsSectionWide customWidth="90em">
                <SettingsParagraph>
                    {c('Info').t`You can define the policies of ${PASS_APP_NAME} for the organization members.`}
                </SettingsParagraph>
                {organizationSettings && (
                    <>
                        <div className="mb-10">
                            {policies.map(({ setting, label, description }) => (
                                <SettingsLayout key={setting} className="pb-4">
                                    <SettingsLayoutLeft className="pass-policy-label">
                                        <label htmlFor={`${setting}-toggle`}>
                                            <div className="text-semibold">{label}</div>
                                            {description && (
                                                <div className="color-weak text-sm mr-2">{description}</div>
                                            )}
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
                                            loading={touched.current === setting && loading}
                                        />
                                    </SettingsLayoutRight>
                                </SettingsLayout>
                            ))}
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
                                        onChange={handleLockChange}
                                    />
                                </SettingsLayoutRight>
                            </SettingsLayout>
                        </div>

                        {showPasswordGenerator && (
                            <SubSettingsSection
                                id="password-generator"
                                title={c('Title').t`Password generator rules`}
                                className="container-section-sticky-section"
                            >
                                <div className="color-weak mb-4">
                                    {c('Description')
                                        .t`You can enforce the password rules that organization members will use when they generate a password in ${PASS_APP_NAME}.`}
                                </div>
                                <PasswordGeneratorPolicyForm
                                    config={organizationSettings.Settings?.PasswordPolicy ?? null}
                                    onSubmit={handleSubmitPasswordGenerator}
                                    loading={loading}
                                />
                            </SubSettingsSection>
                        )}

                        {showPauseList && (
                            <SubSettingsSection
                                id="pause-list"
                                title={c('Title').t`Pause list`}
                                className="container-section-sticky-section"
                            >
                                <div className="color-weak">
                                    {c('Description')
                                        .t`You can customize the list of domains where certain auto functions in ${PASS_APP_NAME} browser extension (Autofill, Autosuggest, Autosave) should not be run.`}
                                </div>
                                <div className="color-weak mb-4 text-semibold">
                                    {c('Description').t`A checked box means the feature is disabled.`}
                                </div>
                                <PauseList />
                            </SubSettingsSection>
                        )}
                    </>
                )}
            </SettingsSectionWide>

            {!didLoad.current && loading && <CircleLoader />}
            {!loading && !organizationSettings && <GenericError className="mt-16" />}
        </>
    );
};

export default PassPolicies;

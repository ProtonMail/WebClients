import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import { PassLockSelector } from '@proton/components/containers/pass/PassLockSelector';
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

type GetPoliciesProps = {
    showVaultCreation: boolean;
};
const getPolicies = ({
    showVaultCreation = false,
}: GetPoliciesProps): { setting: keyof OrganizationSettings; label: string; tooltip: string }[] => [
    {
        setting: 'ShareMode',
        label: c('Label').t`Disable sharing outside the organization`,
        tooltip: c('Info')
            .t`If this option is turned on, organization members will only be able to share vaults or items within the organization`,
    },
    {
        setting: 'ItemShareMode',
        label: c('Label').t`Enable individual item sharing`,
        tooltip: c('Info')
            .t`If this option is turned on, organization members will be able to share individual items in addition to vaults.`,
    },
    {
        setting: 'ExportMode',
        label: c('Label').t`Disable data export for organization members`,
        tooltip: c('Info')
            .t`By default, organization members can only export vaults where they are the owners. If this option is turned on, they won't be able to export any data`,
    },
    ...(showVaultCreation
        ? [
              {
                  setting: 'VaultCreateMode',
                  label: c('Label').t`Restrict vault creation to administrators only`,
                  tooltip: c('Info')
                      .t`If this option is enabled, organization members cannot create vaults. New members will require an admin to manually create the first vault for them (via sharing) so they can start to create items`,
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
    const [organizationSettings, setOrganizationSettings] = useState<Maybe<OrganizationGetResponse>>();

    const policies = getPolicies({ showVaultCreation });

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

    const handleToggle = async (checked: boolean, setting: keyof OrganizationSettings) => {
        touched.current = setting;
        const value = checked ? BitField.ACTIVE : BitField.DISABLED;
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
            <SettingsSection>
                <SettingsParagraph>
                    {c('Info').t`You can define the policies of ${PASS_APP_NAME} for the organization members.`}
                </SettingsParagraph>
                {organizationSettings && (
                    <>
                        <div className="mb-10">
                            {policies.map(({ setting, label, tooltip }) => (
                                <SettingsLayout key={setting} className="pb-4">
                                    <SettingsLayoutLeft>
                                        <label htmlFor={`${setting}-toggle`}>
                                            <span className="text-semibold mr-1">{label}</span>
                                            {tooltip && <Info title={tooltip} />}
                                        </label>
                                    </SettingsLayoutLeft>
                                    <SettingsLayoutRight isToggleContainer>
                                        <Toggle
                                            checked={organizationSettings.Settings?.[setting] === BitField.ACTIVE}
                                            id={`${setting}-toggle`}
                                            onChange={({ target }) => handleToggle(target.checked, setting)}
                                            disabled={loading || !organizationSettings.CanUpdate}
                                            loading={touched.current === setting && loading}
                                        />
                                    </SettingsLayoutRight>
                                </SettingsLayout>
                            ))}
                            <SettingsLayout className="pb-4">
                                <SettingsLayoutLeft>
                                    <label
                                        className="text-semibold"
                                        htmlFor="pass-lock-select"
                                        id="label-pass-lock-select"
                                    >
                                        <span className="mr-1"> {c('Label').t`Lock app after inactivity`}</span>
                                        <Info
                                            title={c('Info')
                                                .t`After being locked, organization members will need to unlock ${PASS_APP_NAME} with their password or PIN etc.`}
                                        />
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
                    </>
                )}
            </SettingsSection>

            {!didLoad.current && loading && <CircleLoader />}
            {!loading && !organizationSettings && <GenericError className="mt-16" />}
        </>
    );
};

export default PassPolicies;

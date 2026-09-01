import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import useLoading from '@proton/hooks/useLoading';
import { usePassBridge } from '@proton/pass/lib/bridge/PassBridgeProvider';
import type { OrganizationGetResponse, OrganizationUpdatePasswordPolicyInput } from '@proton/pass/types';
import { BitField, type Maybe, OrganizationVaultCreateMode } from '@proton/pass/types';
import type { OrganizationSettings } from '@proton/pass/types/data/organization';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import Option from '../../components/option/Option';
import SelectTwo from '../../components/selectTwo/SelectTwo';
import Toggle from '../../components/toggle/Toggle';
import InputFieldTwo from '../../components/v2/field/InputField';
import useErrorHandler from '../../hooks/useErrorHandler';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import SettingsParagraph from '../account/SettingsParagraph';
import SettingsSectionWide from '../account/SettingsSectionWide';
import { PromotionBanner } from '../banner/PromotionBanner';
import GenericError from '../error/GenericError';
import SubSettingsSection from '../layout/SubSettingsSection';
import { PassLockSelector } from '../pass/PassLockSelector';
import { PasswordGeneratorPolicyForm } from '../pass/PasswordGeneratorPolicyForm';
import { PauseList } from '../pass/pauseList/PauseListPolicy';
import { useSubscriptionModal } from '../payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../payments/subscription/constants';

import './PassPolicies.scss';

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

const getPolicies = (): PolicyItem[] => [
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
];

const PassPolicies = ({ upgradeRequired }: { upgradeRequired: boolean }) => {
    const { organization } = usePassBridge();
    const [loading, withLoading] = useLoading(!upgradeRequired);
    const { createNotification } = useNotifications();
    const handleError = useErrorHandler();
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();

    const [organizationSettings, setOrganizationSettings] = useState<Maybe<OrganizationGetResponse>>();

    const policies = getPolicies();

    const touched = useRef<keyof OrganizationSettings>();
    const didLoad = useRef(false);

    useEffect(() => {
        // Plans without the policies feature (e.g. Pass Essentials) can't read the org
        // policy settings, so don't even attempt the fetch — the page is an upsell preview.
        if (upgradeRequired) {
            return;
        }

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

    const handleCreateVaultsChange = (value: OrganizationVaultCreateMode) => {
        touched.current = 'VaultCreateMode';

        withLoading(
            organization.settings.set('VaultCreateMode', value).then((orgSettings) => {
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

    const handleSubmitPasswordGenerator = async (config: OrganizationUpdatePasswordPolicyInput) => {
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
                {upgradeRequired && (
                    <PromotionBanner
                        rounded
                        mode="banner"
                        contentCentered={false}
                        className="mb-6"
                        description={
                            <div>
                                <b>{c('Info').t`Upgrade to define policies for your organization.`}</b>
                            </div>
                        }
                        cta={
                            <Button
                                color="norm"
                                loading={loadingSubscriptionModal}
                                onClick={() => {
                                    void openSubscriptionModal({
                                        step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
                                    });
                                }}
                            >
                                {c('Action').t`Upgrade`}
                            </Button>
                        }
                    />
                )}
                <SettingsParagraph>
                    {c('Info').t`You can define the policies of ${PASS_APP_NAME} for the organization members.`}
                </SettingsParagraph>
                {organizationSettings && (
                    <fieldset
                        disabled={upgradeRequired}
                        className={clsx('m-0 p-0 border-none', upgradeRequired && 'opacity-70')}
                    >
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
                                    <label htmlFor="pass-vault-creation" id="label-pass-vault-creation">
                                        <div className="text-semibold">{c('Label')
                                            .t`Allow all users to create vaults`}</div>
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
                                        onValue={handleCreateVaultsChange}
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
                                        onChange={handleLockChange}
                                    />
                                </SettingsLayoutRight>
                            </SettingsLayout>
                        </div>

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
                            <PauseList upgradeRequired={upgradeRequired} />
                        </SubSettingsSection>
                    </fieldset>
                )}
            </SettingsSectionWide>

            {!didLoad.current && loading && <CircleLoader />}
            {!loading && !organizationSettings && !upgradeRequired && <GenericError className="mt-16" />}
        </>
    );
};

export default PassPolicies;

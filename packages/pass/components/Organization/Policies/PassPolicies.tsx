import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import GenericError from '@proton/components/containers/error/GenericError';
import SubSettingsSection from '@proton/components/containers/layout/SubSettingsSection';
import clsx from '@proton/utils/clsx';

import { PassPoliciesUpgradeBanner } from '../PassUpgradeBanner';
import { PassPasswordGeneratorPolicy } from './PassPasswordGeneratorPolicy';
import { PassPauseListPolicy } from './PassPauseListPolicy';
import { PassPermissionsPolicies } from './PassPermissionsPolicies';
import { PassPoliciesDescription } from './PassPoliciesDescription';
import { usePassOrganizationSettings } from './usePassOrganizationSettings';

/** All Pass policies on one page, as mounted in Account. Console mounts each section as its own page. */
const PassPolicies = ({ upgradeRequired }: { upgradeRequired: boolean }) => {
    const settings = usePassOrganizationSettings(upgradeRequired);
    const { organizationSettings, loading } = settings;

    return (
        <>
            <SettingsSectionWide customWidth="90em">
                {upgradeRequired && <PassPoliciesUpgradeBanner />}
                <PassPoliciesDescription />
                {organizationSettings && (
                    <fieldset
                        disabled={upgradeRequired}
                        className={clsx('m-0 p-0 border-none', upgradeRequired && 'opacity-70')}
                    >
                        <div className="mb-10">
                            <PassPermissionsPolicies
                                organizationSettings={organizationSettings}
                                loading={loading}
                                touchedSetting={settings.touchedSetting}
                                onSettingChange={settings.setSetting}
                            />
                        </div>

                        <SubSettingsSection
                            id="password-generator"
                            title={c('Title').t`Password generator rules`}
                            className="container-section-sticky-section"
                        >
                            <PassPasswordGeneratorPolicy
                                organizationSettings={organizationSettings}
                                loading={loading}
                                onSubmit={settings.setPasswordGeneratorPolicy}
                            />
                        </SubSettingsSection>

                        <SubSettingsSection
                            id="pause-list"
                            title={c('Title').t`Pause list`}
                            className="container-section-sticky-section"
                        >
                            <PassPauseListPolicy upgradeRequired={upgradeRequired} />
                        </SubSettingsSection>
                    </fieldset>
                )}
            </SettingsSectionWide>

            {settings.showLoader && <CircleLoader />}
            {settings.showError && <GenericError className="mt-16" />}
        </>
    );
};

export default PassPolicies;

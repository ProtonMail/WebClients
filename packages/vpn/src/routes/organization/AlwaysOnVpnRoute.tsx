import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { Href } from '@proton/atoms/Href/Href';
import Loader from '@proton/components/components/loader/Loader';
import ProtonBadge from '@proton/components/components/protonBadge/ProtonBadge';
import { PrivateMainSettingsAreaBase } from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { SectionConfig } from '@proton/components/containers/layout/interface';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { AlwaysOn } from '../../components/AlwaysOn/AlwaysOn';
import { useB2BAdminNavigation } from '../../contexts/NavigationContext';
import { findNavItem } from '../../definitions/routes';

type Props = {
    config: SectionConfig;
};

export const AlwaysOnVpnRoute = ({ config }: Props) => {
    const adminSidebarFeature = useB2BAdminNavigation();
    if (adminSidebarFeature.loading) {
        return <Loader />;
    }

    const alwaysOnNavConfig = adminSidebarFeature.enabled
        ? findNavItem(adminSidebarFeature.nav, 'organization.vpn.always-on')
        : undefined;

    const description = (
        <>
            <Banner variant={BannerVariants.WARNING} className="mb-4">
                <span className="text-semibold">{c('Info')
                    .t`SSO users can't sign in on devices with always-on enforced.`}</span>
                <br />
                <span>{c('Info').t`Exclude them when you deploy the device profile. Support coming soon.`}</span>
            </Banner>
            <span>
                {c('Subtitle')
                    .t`Enforce VPN usage across your organization by blocking internet access unless a VPN connection is active.`}{' '}
            </span>
            <Href href={getKnowledgeBaseUrl('/mdm-always-on-vpn')}>{c('Link').t`Learn more`}</Href>
        </>
    );

    return (
        <PrivateMainSettingsAreaBase
            title={alwaysOnNavConfig ? alwaysOnNavConfig.label : config.text}
            titleBadge={<ProtonBadge text={c('Info').t`Beta`} tooltipText={c('Tooltip').t`Feature in early access`} />}
            description={description}
        >
            <AlwaysOn />
        </PrivateMainSettingsAreaBase>
    );
};

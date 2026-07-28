import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import Loader from '@proton/components/components/loader/Loader';
import { PrivateMainSettingsAreaBase } from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { SectionConfig } from '@proton/components/containers/layout/interface';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { AlwaysOn } from '../../components/AlwaysOn/AlwaysOn';
import { useB2BAdminNavigation } from '../../contexts/NavigationContext';
import { findNavItem } from '../../definitions/routes';

type Props = {
    config: SectionConfig;
};

const description = (
    <>
        {c('Subtitle')
            .t`Enforce VPN usage across your organization by blocking internet access unless a VPN connection is active.`}{' '}
        <Href href={getKnowledgeBaseUrl('/mdm-always-on-vpn')}>{c('Link').t`Learn more`}</Href>
    </>
);

export const AlwaysOnVpnRoute = ({ config }: Props) => {
    const adminSidebarFeature = useB2BAdminNavigation();
    if (adminSidebarFeature.loading) {
        return <Loader />;
    }

    const alwaysOnNavConfig = adminSidebarFeature.enabled
        ? findNavItem(adminSidebarFeature.nav, 'organization.vpn.always-on')
        : undefined;

    return (
        <PrivateMainSettingsAreaBase
            title={alwaysOnNavConfig ? alwaysOnNavConfig.label : config.text}
            description={description}
        >
            <AlwaysOn />
        </PrivateMainSettingsAreaBase>
    );
};

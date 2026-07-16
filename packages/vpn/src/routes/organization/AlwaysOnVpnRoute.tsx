import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { PrivateMainSettingsAreaBase } from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { SectionConfig } from '@proton/components/containers/layout/interface';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { AlwaysOn } from '../../components/AlwaysOn/AlwaysOn';

type Props = {
    config: SectionConfig;
};

export const AlwaysOnVpnRoute = ({ config }: Props) => (
    <PrivateMainSettingsAreaBase
        title={config.text}
        description={
            <>
                {config.description}{' '}
                <Href href={getKnowledgeBaseUrl('/mdm-always-on-vpn')}>{c('Link').t`Learn more`}</Href>
            </>
        }
    >
        <AlwaysOn />
    </PrivateMainSettingsAreaBase>
);

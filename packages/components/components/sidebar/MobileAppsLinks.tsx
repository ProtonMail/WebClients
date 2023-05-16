import { Fragment } from 'react';

import { FeatureCode } from '@proton/components/containers';
import { useConfig, useFeature, useUser } from '@proton/components/hooks';
import { APP_NAMES } from '@proton/shared/lib/constants';

import ProductLink, { apps } from '../../containers/app/ProductLink';
import { Logo } from '../logo';
import MobileNavServices from './MobileNavServices';

interface Props {
    app: APP_NAMES;
}

const MobileAppsLinks = ({ app }: Props) => {
    const [user] = useUser();
    const { APP_NAME } = useConfig();
    const passSettingsFeature = useFeature<boolean>(FeatureCode.PassSettings);
    const isPassSettingsEnabled = passSettingsFeature.feature?.Value === true;

    return (
        <MobileNavServices>
            {apps({ isPassSettingsEnabled }).map((appToLinkTo) => {
                return (
                    <Fragment key={appToLinkTo}>
                        <ProductLink ownerApp={APP_NAME} app={app} appToLinkTo={appToLinkTo} user={user}>
                            <Logo appName={appToLinkTo} variant="glyph-only" className="flex-item-noshrink mr-2" />
                        </ProductLink>
                    </Fragment>
                );
            })}
        </MobileNavServices>
    );
};

export default MobileAppsLinks;

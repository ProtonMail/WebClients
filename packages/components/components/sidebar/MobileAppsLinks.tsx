import { Fragment } from 'react';

import { useConfig, useUser } from '@proton/components/hooks';
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

    return (
        <MobileNavServices>
            {apps().map((appToLinkTo) => {
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

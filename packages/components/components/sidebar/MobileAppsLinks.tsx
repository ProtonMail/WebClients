import { Fragment } from 'react';

import { FeatureCode } from '@proton/components/containers';
import { useConfig, useFeature, useUser } from '@proton/components/hooks';
import { APP_NAMES } from '@proton/shared/lib/constants';

import appsLinks from '../../containers/app/appsLinks';
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
            {appsLinks({ app, user, isPassSettingsEnabled, ownerApp: APP_NAME }).map((app) => {
                return <Fragment key={app.key}>{app}</Fragment>;
            })}
        </MobileNavServices>
    );
};

export default MobileAppsLinks;

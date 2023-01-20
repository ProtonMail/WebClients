import { Children, Fragment, isValidElement } from 'react';

import { APP_NAMES } from '@proton/shared/lib/constants';

import AppsLinks from '../../containers/app/AppsLinks';
import MobileNavServices from './MobileNavServices';

interface Props {
    app: APP_NAMES;
}

const MobileAppsLinks = ({ app }: Props) => {
    return (
        <MobileNavServices>
            {Children.toArray(<AppsLinks app={app} currentItem />)
                .filter(isValidElement)
                .map((child) => {
                    return <Fragment key={child.key}>{child}</Fragment>;
                })}
        </MobileNavServices>
    );
};

export default MobileAppsLinks;

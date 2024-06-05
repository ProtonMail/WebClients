import { ReactNode } from 'react';

import { YourPlanSection, useConfig } from '@proton/components';

import './MobileSettings.scss';
import './SubscriptionDetails.scss';

const SubscriptionDetails = ({ layout }: { layout: (children: ReactNode, props?: any) => ReactNode }) => {
    const { APP_NAME } = useConfig();
    return layout(
        <div className="mobile-settings">
            <div className="subscription-details-container">
                <YourPlanSection app={APP_NAME} />
            </div>
        </div>,
        { className: 'overflow-auto' }
    );
};

export default SubscriptionDetails;

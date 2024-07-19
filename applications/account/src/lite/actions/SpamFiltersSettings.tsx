import type { ReactNode } from 'react';

import { c } from 'ttag';

import { SpamFiltersSection } from '@proton/components';

import MobileSection from '../components/MobileSection';

import './MobileSettings.scss';

const SpamFiltersSettings = ({ layout }: { layout: (children: ReactNode, props?: any) => ReactNode }) => {
    return layout(
        <div className="mobile-settings">
            <MobileSection title={c('Title').t`Spam filters`}>
                <div className="spam-filters">
                    <SpamFiltersSection />
                </div>
            </MobileSection>
        </div>,
        { className: 'overflow-auto' }
    );
};

export default SpamFiltersSettings;

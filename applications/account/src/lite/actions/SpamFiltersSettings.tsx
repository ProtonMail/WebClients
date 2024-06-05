import { ReactNode } from 'react';

import { c } from 'ttag';

import { SpamFiltersSection } from '@proton/components';

import MobileSection from '../components/MobileSection';

const SpamFiltersSettings = ({ layout }: { layout: (children: ReactNode, props?: any) => ReactNode }) => {
    return layout(
        <div className="mobile-settings">
            <MobileSection title={c('Title').t`Spam filters`}>
                <SpamFiltersSection />
            </MobileSection>
        </div>,
        { className: 'overflow-auto' }
    );
};

export default SpamFiltersSettings;

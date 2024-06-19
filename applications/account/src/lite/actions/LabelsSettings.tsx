import { ReactNode } from 'react';

import { c } from 'ttag';

import { FoldersSection, LabelsSection } from '@proton/components';

import MobileSection from '../components/MobileSection';

import './MobileSettings.scss';

const LabelsSettings = ({ layout }: { layout: (children: ReactNode, props?: any) => ReactNode }) => {
    return layout(
        <div className="mobile-settings">
            <MobileSection title={c('Title').t`Custom folders and labels`}>
                <FoldersSection />
                <LabelsSection />
            </MobileSection>
        </div>,
        { className: 'overflow-auto' }
    );
};

export default LabelsSettings;

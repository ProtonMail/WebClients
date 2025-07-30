import type { ReactNode } from 'react';

import { FoldersSection, LabelsSection } from '@proton/components';

import MobileSection from '../components/MobileSection';

import './MobileSettings.scss';

const LabelsSettings = ({ layout }: { layout: (children: ReactNode, props?: any) => ReactNode }) => {
    return layout(
        <div className="mobile-settings">
            <MobileSection>
                <FoldersSection showPromptOnAction />
                <LabelsSection showPromptOnAction />
            </MobileSection>
        </div>,
        { className: 'overflow-auto' }
    );
};

export default LabelsSettings;

import { useState } from 'react';

import { c } from 'ttag';

import type { Tab } from '@proton/components/components/tabs/Tabs';
import { Tabs } from '@proton/components/components/tabs/Tabs';
import { IcBrandApple } from '@proton/icons/icons/IcBrandApple';
import { IcBrandWindows } from '@proton/icons/icons/IcBrandWindows';

import { useIsMacOSSupportEnabled } from '../../../../contexts/AlwaysOnPolicyServiceContext';
import type { AlwaysOnPolicyArtifact } from '../../../../types/AlwaysOn';
import { hiddenInertProps } from '../ConfigureProfileModal/hiddenInertProps';
import { MacInstructions } from './MacInstructions';
import { WindowsInstructions } from './WindowsInstructions';

interface Props {
    /** The Windows installer artifact generated for the policy — its filename and content are offered for download. */
    windows?: AlwaysOnPolicyArtifact;
    /** The `.rego` device profile — its filename and content are offered for download. */
    rego?: AlwaysOnPolicyArtifact;
}

const WINDOWS_TAB = 0;
const MACOS_TAB = 1;

export const InstructionsContent = ({ windows, rego }: Props) => {
    const isMacOSSupportEnabled = useIsMacOSSupportEnabled();
    const [platformTab, setPlatformTab] = useState(WINDOWS_TAB);

    // Remove in VPNB2B-182
    if (!isMacOSSupportEnabled) {
        return <WindowsInstructions windows={windows} rego={rego} />;
    }

    const tabs: Tab[] = [
        { title: c('Title').t`Windows`, icon: <IcBrandWindows />, iconPosition: 'leading' },
        { title: c('Title').t`macOS`, icon: <IcBrandApple />, iconPosition: 'leading' },
    ];

    return (
        <>
            <Tabs tabs={tabs} variant="modern" fullWidth value={platformTab} onChange={setPlatformTab} />
            {/* Both panels are stacked in the same grid cell so the container's height is always that of the
             * tallest one — switching tabs doesn't resize the modal. */}
            <div className="pt-4" style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
                <div style={{ gridArea: '1 / 1' }} {...hiddenInertProps(platformTab !== WINDOWS_TAB)}>
                    <WindowsInstructions windows={windows} rego={rego} />
                </div>
                <div style={{ gridArea: '1 / 1' }} {...hiddenInertProps(platformTab !== MACOS_TAB)}>
                    <MacInstructions />
                </div>
            </div>
        </>
    );
};

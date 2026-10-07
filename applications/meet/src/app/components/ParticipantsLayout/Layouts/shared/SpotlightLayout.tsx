import type { ReactNode } from 'react';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsSideBarOpen } from '@proton/meet/store/slices/uiStateSlice';

import { ParticipantSidebar } from './ParticipantSidebar/ParticipantSidebar';

type SpotlightLayoutProps = {
    ariaLabel: string;
    children: ReactNode;
};

enum SpotlightSize {
    Default = 8,
    // Using 0 instead of removing the spotlight to avoid reinitializing the screenshare video
    NarrowWithSidebar = 0,
}

const resolveSpotlightSize = (isSideBarOpen: boolean, isAtLeastMedium: boolean) =>
    !isAtLeastMedium && isSideBarOpen ? SpotlightSize.NarrowWithSidebar : SpotlightSize.Default;

export const SpotlightLayout = ({ ariaLabel, children }: SpotlightLayoutProps) => {
    const { viewportWidth } = useActiveBreakpoint();
    const isAtLeastMedium = !viewportWidth['<=small'];

    const isSideBarOpen = useMeetSelector(selectIsSideBarOpen);

    return (
        <>
            <section
                aria-label={ariaLabel}
                className="bg-strong h-full overflow-hidden mx-auto my-0 rounded relative shrink-1"
                style={{
                    flexGrow: resolveSpotlightSize(isSideBarOpen, isAtLeastMedium),
                    flexBasis: 0,
                }}
            >
                {children}
            </section>
            {isAtLeastMedium && <ParticipantSidebar />}
        </>
    );
};

import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    ParticipantsLayouts,
    SpotlightSources,
    selectParticipantsLayout,
    selectSpotlightSource,
} from '@proton/meet/store/slices/layoutSlice';
import { selectIsScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';
import { selectIsSideBarOpen } from '@proton/meet/store/slices/uiStateSlice';

import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { ParticipantGridLayout } from './Layouts/ParticipantGridLayout';
import { ShareScreenLayout } from './Layouts/ShareScreenLayout';
import { SpeakerLayout } from './Layouts/SpeakerLayout';

export const ParticipantsLayout = () => {
    const isLargerThanMd = useIsLargerThanMd();

    const isSideBarOpen = useMeetSelector(selectIsSideBarOpen);
    const isScreenShare = useMeetSelector(selectIsScreenShare);
    const participantsLayout = useMeetSelector(selectParticipantsLayout);
    const spotlightSource = useMeetSelector(selectSpotlightSource);

    if (participantsLayout === ParticipantsLayouts.Speaker) {
        return spotlightSource === SpotlightSources.ScreenShare && isScreenShare ? (
            <ShareScreenLayout />
        ) : (
            <SpeakerLayout />
        );
    }

    return (
        (isLargerThanMd || !isSideBarOpen) && (
            <div className="h-full shrink-0" style={{ flexGrow: 8, flexBasis: 0 }}>
                <ParticipantGridLayout />
            </div>
        )
    );
};

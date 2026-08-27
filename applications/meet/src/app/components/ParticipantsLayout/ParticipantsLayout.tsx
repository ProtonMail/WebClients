import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';
import { selectIsSideBarOpen } from '@proton/meet/store/slices/uiStateSlice';

import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { ParticipantGridLayout } from './Layouts/ParticipantGridLayout';
import { ShareScreenLayout } from './Layouts/ShareScreenLayout';

type ParticipantsLayoutProps = {
    participantSideBarOpen: boolean;
    setParticipantSideBarOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ParticipantsLayout = ({ participantSideBarOpen, setParticipantSideBarOpen }: ParticipantsLayoutProps) => {
    const isLargerThanMd = useIsLargerThanMd();

    const isSideBarOpen = useMeetSelector(selectIsSideBarOpen);
    const isScreenShare = useMeetSelector(selectIsScreenShare);

    return isScreenShare ? (
        <ShareScreenLayout
            participantSideBarOpen={participantSideBarOpen}
            setParticipantSideBarOpen={setParticipantSideBarOpen}
        />
    ) : (
        (isLargerThanMd || !isSideBarOpen) && (
            <div className="h-full shrink-0" style={{ flexGrow: 8, flexBasis: 0 }}>
                <ParticipantGridLayout />
            </div>
        )
    );
};

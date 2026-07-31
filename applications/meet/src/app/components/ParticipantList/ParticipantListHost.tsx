import { useState } from 'react';

import type { Participant } from 'livekit-client';
import { c } from 'ttag';

import { Tabs } from '@proton/components/components/tabs/Tabs';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectWaitingParticipantsCount } from '@proton/meet/store/slices/waitingRoomSlice';

import { AllParticipantsTab } from './AllParticipantsTab/AllParticipantsTab';
import { TabHeader } from './TabHeader';
import { WaitingRoomTab } from './WaitingRoomTab/WaitingRoomTab';

enum ParticipantListTabs {
    WaitingRoom,
    AllParticipants,
}

export const ParticipantListHost = ({
    isSearchOn,
    participants,
    participantsCount,
    searchExpression,
    setIsScrolled,
}: {
    isSearchOn: boolean;
    participants: Participant[];
    participantsCount: number;
    searchExpression: string;
    setIsScrolled: (isScrolled: boolean) => void;
}) => {
    const [participantListTab, setParticipantListTab] = useState(ParticipantListTabs.AllParticipants);

    const hasSearchQuery = isSearchOn && searchExpression !== '';

    const waitingRoomParticipantsCount = useMeetSelector(selectWaitingParticipantsCount);

    return (
        <Tabs
            className="h-full flex flex-column flex-nowrap"
            contentClassName="flex-1 min-h-0"
            value={participantListTab}
            onChange={(value) => setParticipantListTab(value)}
            tabs={[
                {
                    title: 'waiting-room',
                    titleNode: <TabHeader title={c('Title').t`Waiting room`} count={waitingRoomParticipantsCount} />,
                    content: (
                        <WaitingRoomTab
                            setIsScrolled={setIsScrolled}
                            searchExpression={hasSearchQuery ? searchExpression : ''}
                        />
                    ),
                },
                {
                    title: 'all-participants',
                    titleNode: <TabHeader title={c('Title').t`All participants`} count={participantsCount} />,
                    content: <AllParticipantsTab participants={participants} setIsScrolled={setIsScrolled} />,
                },
            ]}
        />
    );
};

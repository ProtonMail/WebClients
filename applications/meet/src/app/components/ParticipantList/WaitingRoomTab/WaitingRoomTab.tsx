import type { Participant } from 'livekit-client';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { IcMeetUsers } from '@proton/icons/icons/IcMeetUsers';

import { EmptyList } from '../shared/EmptyList';
import { ParticipantListContainer } from '../shared/ParticipantListContainer';
import { WaitingRoomItem } from './WaitingRoomItem';

import './WaitingRoomTab.scss';

type Props = {
    participants: Participant[];
    setIsScrolled: (isScrolled: boolean) => void;
    hasSearchQuery: boolean;
};

const EmptyWaitingRoomList = ({ hasSearchQuery }: { hasSearchQuery: boolean }) => {
    if (hasSearchQuery) {
        return (
            <EmptyList
                icon={<IcMagnifier size={7} />}
                title={c('Title').t`No results found`}
                description={c('Description').t`Try a different name.`}
            />
        );
    }

    return (
        <EmptyList
            icon={<IcMeetUsers size={7} />}
            title={c('Title').t`No one is waiting`}
            description={c('Description').t`You'll see people here when they join the meeting.`}
        />
    );
};

export const WaitingRoomTab = ({ participants, setIsScrolled, hasSearchQuery }: Props) => {
    const isEmpty = participants.length === 0;

    return (
        <div className="flex flex-column flex-nowrap h-full relative pt-4">
            {isEmpty ? (
                <EmptyWaitingRoomList hasSearchQuery={hasSearchQuery} />
            ) : (
                <ParticipantListContainer title={c('Title').t`Waiting room`} setIsScrolled={setIsScrolled}>
                    {participants.map((participant) => {
                        return (
                            <li key={participant.identity}>
                                <WaitingRoomItem participant={participant} />
                            </li>
                        );
                    })}
                </ParticipantListContainer>
            )}
            <div className="waiting-room-tab-footer absolute bottom-0 left-0 w-full p-4">
                <Button className="secondary w-full rounded-full px-8 py-3" disabled={isEmpty}>
                    {c('Action').t`Admit all`}
                </Button>
            </div>
        </div>
    );
};

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useLoading from '@proton/hooks/useLoading';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { IcMeetUsers } from '@proton/icons/icons/IcMeetUsers';
import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectCanAdmitAll,
    selectWaitingParticipants,
    selectWaitingParticipantsWithNames,
} from '@proton/meet/store/slices/waitingRoomSlice';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { useWaitingRoomContext } from '../../../contexts/WaitingRoomContext';
import { EmptyList } from '../shared/EmptyList';
import { ParticipantListContainer } from '../shared/ParticipantListContainer';
import { WaitingRoomItem } from './WaitingRoomItem';

import './WaitingRoomTab.scss';

type Props = {
    setIsScrolled: (isScrolled: boolean) => void;
    searchExpression: string;
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

export const WaitingRoomTab = ({ setIsScrolled, searchExpression }: Props) => {
    const isMeetWaitingRoomEnabled = useFlag('MeetWaitingRoom');

    const { admitAll } = useWaitingRoomContext();

    const waitingParticipants = useMeetSelector(selectWaitingParticipants);
    const waitingParticipantsWithNames = useMeetSelector(selectWaitingParticipantsWithNames);
    const canAdmitAll = useMeetSelector(selectCanAdmitAll);

    const [admitAllLoading, withAdmitAllLoading] = useLoading();

    const hasSearchQuery = searchExpression !== '';

    const filteredRequests = hasSearchQuery
        ? waitingParticipantsWithNames.filter((waitingParticipant) =>
              waitingParticipant.name.toLowerCase().includes(searchExpression.toLowerCase())
          )
        : waitingParticipants;

    const isEmpty = filteredRequests.length === 0;

    return (
        <div className={clsx('flex flex-column flex-nowrap h-full relative', !isMeetWaitingRoomEnabled && 'pt-4')}>
            {isEmpty ? (
                <EmptyWaitingRoomList hasSearchQuery={hasSearchQuery} />
            ) : (
                <ParticipantListContainer title={c('Title').t`Waiting room`} setIsScrolled={setIsScrolled}>
                    {filteredRequests.map((request) => {
                        return (
                            <li key={request.requestId}>
                                <WaitingRoomItem request={request} />
                            </li>
                        );
                    })}
                </ParticipantListContainer>
            )}
            <div className="waiting-room-tab-footer absolute bottom-0 left-0 w-full p-4">
                <Button
                    className="secondary w-full rounded-full px-8 py-3"
                    disabled={canAdmitAll}
                    onClick={() => {
                        void withAdmitAllLoading(admitAll());
                    }}
                    loading={admitAllLoading}
                >
                    {c('Action').t`Admit all`}
                </Button>
            </div>
        </div>
    );
};

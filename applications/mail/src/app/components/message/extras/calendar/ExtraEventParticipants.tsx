import { useState } from 'react';

import { c, msgid } from 'ttag';

import { UnderlineButton } from '@proton/components';
import { Participant } from '@proton/shared/lib/interfaces/calendar';

import ExtraEventParticipant from './ExtraEventParticipant';

interface Props {
    list: Participant[];
}
const ExtraEventParticipants = ({ list }: Props) => {
    const [isShowingMore, setIsShowingMore] = useState(false);

    const [organizer, ...attendees] = list;
    const totalAttendees = attendees.length;
    const toggleShowMore = () => setIsShowingMore((prevState) => !prevState);

    if (totalAttendees <= 1) {
        return (
            <>
                {list.map((participant, i) => {
                    return (
                        <ExtraEventParticipant
                            participant={participant}
                            isOrganizer={i === 0}
                            key={participant.emailAddress}
                        />
                    );
                })}
            </>
        );
    }

    return (
        <>
            <ExtraEventParticipant participant={organizer} isOrganizer />
            {!isShowingMore && (
                <div className="flex flex-align-items-center">
                    <span className="mr0-5">
                        {c('ICS widget label for event details').ngettext(
                            msgid`${totalAttendees} participant`,
                            `${totalAttendees} participants`,
                            totalAttendees
                        )}
                    </span>
                    <UnderlineButton onClick={toggleShowMore}>{c('Action').t`Show`}</UnderlineButton>
                </div>
            )}
            {isShowingMore &&
                attendees.map((participant) => {
                    return <ExtraEventParticipant participant={participant} key={participant.emailAddress} />;
                })}
            {}
            {isShowingMore && (
                <div>
                    <UnderlineButton onClick={toggleShowMore}>{c('Action').t`Show less`}</UnderlineButton>
                </div>
            )}
        </>
    );
};

export default ExtraEventParticipants;

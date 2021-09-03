import { LinkButton } from '@proton/components';
import { Participant } from '@proton/shared/lib/interfaces/calendar';
import { useState } from 'react';
import { c } from 'ttag';
import ExtraEventParticipant from './ExtraEventParticipant';

const DEFAULT_NUMBER_VISIBLE_PARTICIPANTS = 5;

interface Props {
    list: Participant[];
}
const ExtraEventParticipants = ({ list }: Props) => {
    const [isShowingMore, setIsShowingMore] = useState(false);

    if (!list.length) {
        return null;
    }

    const totalParticipants = list.length;
    const totalHiddenParticipants = totalParticipants - DEFAULT_NUMBER_VISIBLE_PARTICIPANTS;
    const listOfVisibleParticipants = isShowingMore ? list : list.slice(0, DEFAULT_NUMBER_VISIBLE_PARTICIPANTS);

    return (
        <>
            {listOfVisibleParticipants.map((participant, i) => {
                return (
                    <ExtraEventParticipant
                        participant={participant}
                        isOrganizer={i === 0}
                        key={participant.emailAddress}
                    />
                );
            })}
            {totalParticipants > DEFAULT_NUMBER_VISIBLE_PARTICIPANTS && (
                <LinkButton onClick={() => setIsShowingMore((prevState) => !prevState)}>
                    {isShowingMore ? c('Action').t`Show less` : c('Action').t`Show ${totalHiddenParticipants} more`}
                </LinkButton>
            )}
        </>
    );
};

export default ExtraEventParticipants;

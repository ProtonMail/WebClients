import { Participant } from 'proton-shared/lib/interfaces/calendar';
import React from 'react';
import { buildMailTo } from 'proton-shared/lib/helpers/email';

interface Props {
    list?: Participant[];
}
const ExtraEventParticipants = ({ list = [] }: Props) => {
    if (!list.length) {
        return null;
    }

    return (
        <div className="text-break">
            {list.map((participant, i) => {
                const { displayEmail, displayName } = participant;
                const isLast = i === list.length - 1;

                if (displayName !== displayEmail) {
                    return (
                        // eslint-disable-next-line react/no-array-index-key
                        <div key={`${displayName}-${displayEmail}-${i}`}>
                            <span title={displayName}>{`${displayName} `}</span>(
                            <a href={buildMailTo(displayEmail)} title={displayEmail}>
                                {displayEmail}
                            </a>
                            ){!isLast && ', '}
                        </div>
                    );
                }
                return (
                    // eslint-disable-next-line react/no-array-index-key
                    <div key={`${displayEmail}-${i}`}>
                        <a href={buildMailTo(displayEmail)} title={displayEmail}>
                            {displayEmail}
                        </a>
                        {!isLast && ', '}
                    </div>
                );
            })}
        </div>
    );
};

export default ExtraEventParticipants;

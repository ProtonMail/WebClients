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
        <div className="break">
            {list.map((participant, i) => {
                const { name, emailAddress } = participant;
                const isLast = i === list.length - 1;

                if (emailAddress) {
                    if (name) {
                        return (
                            <div key={`${name}-${emailAddress}-${i}`}>
                                <span title={name}>{`${name} `}</span>(
                                <a href={buildMailTo(emailAddress)} title={emailAddress}>
                                    {emailAddress}
                                </a>
                                ){!isLast && ', '}
                            </div>
                        );
                    }
                    return (
                        <div key={`${emailAddress}-${i}`}>
                            <a href={buildMailTo(emailAddress)} title={emailAddress}>
                                {emailAddress}
                            </a>
                            {!isLast && ', '}
                        </div>
                    );
                }

                return (
                    <div key={`${name}-${i}`} className="ellipsis">
                        {name}
                    </div>
                );
            })}
        </div>
    );
};

export default ExtraEventParticipants;

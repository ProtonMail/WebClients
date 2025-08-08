import { useEffect, useRef } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';

interface JoiningRoomLoaderProps {
    participantCount?: number;
    participantsLoaded: boolean;
}

export const JoiningRoomLoader = ({ participantCount, participantsLoaded }: JoiningRoomLoaderProps) => {
    const participantCountRef = useRef(0);

    const joingingRoomTitles: { heading: (participantCount?: number) => string; description: string }[] = [
        {
            heading: () => c('meet_2025 Title').t`Securing meeting...`,
            description: c('meet_2025 Description').t`Setting up group end-to-end encryption with MLS.`,
        },
        {
            heading: (participantCount) =>
                !participantCount
                    ? c('meet_2025 Title').t`Starting MLS as the first participant...`
                    : c('meet_2025 Title').t`Negotiating new MLS key with ${participantCount} other participant(s)....`,
            description: !participantCount
                ? c('meet_2025 Description').t`Generating new encryption key`
                : c('meet_2025 Description').t`Rotating encryption key`,
        },
    ];

    const [titleIndex, setTitleIndex] = useState(0);

    useEffect(() => {
        if (!participantsLoaded || titleIndex === 1) {
            return;
        }

        participantCountRef.current = participantCount ?? 0;

        setTitleIndex(1);
    }, [participantsLoaded, titleIndex]);

    return (
        <div
            className="flex flex-column flex-nowrap items-center justify-center md:justify-start  md:h-custom md:w-custom pt-6"
            style={{ '--md-w-custom': '22.625rem', '--md-h-custom': '24rem' }}
        >
            <div className="text-4xl mt-6 mb-4 text-center">
                {joingingRoomTitles[titleIndex].heading(participantCountRef.current)}
            </div>
            <div className="color-weak mb-8 text-center">{joingingRoomTitles[titleIndex].description}</div>
            <CircleLoader
                className="color-primary w-custom h-custom"
                style={{ '--w-custom': '5.3rem', '--h-custom': '5.3rem', '--stroke-width': 1.3 }}
            />
        </div>
    );
};

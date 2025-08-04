import { useEffect, useRef } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';

import { JOIN_TITLE_TIMEOUT } from '../constants';

interface JoiningRoomLoaderProps {
    participantCount?: number;
    participantsLoaded: boolean;
}

export const JoiningRoomLoader = ({ participantCount, participantsLoaded }: JoiningRoomLoaderProps) => {
    const participantCountRef = useRef(0);

    const joingingRoomTitles: { heading: (participantCount?: number) => string; description: string }[] = [
        {
            heading: () => c('l10n_nightly Title').t`Securing meeting...`,
            description: c('l10n_nightly Description').t`Setting up group end-to-end encryption with MLS.`,
        },
        {
            heading: (participantCount) =>
                !participantCount
                    ? c('l10n_nightly Title').t`Starting MLS as the first participant...`
                    : c('l10n_nightly Title')
                          .t`Negotiating new MLS key with ${participantCount} other participant(s)....`,
            description: c('l10n_nightly Description').t`Making sure no one else has the new key`,
        },
    ];

    const initialisedTimeRef = useRef(Date.now());

    const [titleIndex, setTitleIndex] = useState(0);

    useEffect(() => {
        if (!participantsLoaded) {
            return;
        }

        const now = Date.now();

        const timeDiff = now - initialisedTimeRef.current;

        if (timeDiff >= JOIN_TITLE_TIMEOUT) {
            setTitleIndex(1);
            participantCountRef.current = participantCount ?? 0;
            return;
        }

        const timeout = setTimeout(() => {
            setTitleIndex(1);
            participantCountRef.current = participantCount ?? 0;
        }, JOIN_TITLE_TIMEOUT - timeDiff);

        return () => {
            clearTimeout(timeout);
        };
    }, [participantsLoaded]);

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

import { useEffect, useRef } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';

export const JoiningRoomLoader = () => {
    const joingingRoomTitles = [
        {
            heading: c('l10n_nightly Title').t`Encrypting keys...`,
            description: c('l10n_nightly Description').t`Generates unique keys so only invited guests can decode.`,
        },
        {
            heading: c('l10n_nightly Title').t`Locking the room...`,
            description: c('l10n_nightly Description').t`End-to-end protection is sealing out eavesdroppers.`,
        },
        {
            heading: c('l10n_nightly Title').t`Final privacy check...`,
            description: c('l10n_nightly Description').t`Your secure meeting will open in seconds.`,
        },
        {
            heading: c('l10n_nightly Title').t`Getting ready...`,
            description: c('l10n_nightly Description').t`Your private meeting is moments away.`,
        },
    ];

    const [titleIndex, setTitleIndex] = useState(0);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (titleIndex === joingingRoomTitles.length - 1) {
            return;
        }

        timeoutRef.current = setTimeout(() => {
            setTitleIndex((prev) => prev + 1);
        }, 2000);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [titleIndex]);

    return (
        <div
            className="flex flex-column flex-nowrap items-center justify-start h-custom w-custom pt-6"
            style={{ '--w-custom': '22.625rem', '--h-custom': '24rem' }}
        >
            <h1 className="h2 mt-6 mb-4">{joingingRoomTitles[titleIndex].heading}</h1>
            <div className="color-weak mb-8 text-center">{joingingRoomTitles[titleIndex].description}</div>
            <CircleLoader
                className="color-primary w-custom h-custom"
                style={{ '--w-custom': '5.3rem', '--h-custom': '5.3rem', '--stroke-width': 1.3 }}
            />
        </div>
    );
};

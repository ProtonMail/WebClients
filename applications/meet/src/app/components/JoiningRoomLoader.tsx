import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';

interface JoiningRoomLoaderProps {
    participantCount?: number;
    participantsLoaded: boolean;
}

export const JoiningRoomLoader = ({ participantCount, participantsLoaded }: JoiningRoomLoaderProps) => {
    const joiningRoomTitles: { heading: (participantCount?: number) => string; description: string }[] = [
        {
            heading: () => c('Title').t`Securing meeting...`,
            description: c('Description').t`Setting up group end-to-end encryption with MLS.`,
        },
        {
            heading: (participantCount) =>
                !participantCount
                    ? c('Title').t`Starting MLS as the first participant...`
                    : c('Title').t`Negotiating new MLS key with ${participantCount} other participant(s)…`,
            description: !participantCount
                ? c('Description').t`Generating new encryption key`
                : c('Description').t`Rotating encryption key`,
        },
    ];

    const titleIndex = participantsLoaded ? 1 : 0;

    return (
        <div
            className="flex flex-column flex-nowrap items-center justify-center md:justify-start md:h-custom md:w-custom pt-6"
            style={{ '--md-w-custom': '22.625rem', '--md-h-custom': '24rem' }}
        >
            <h2 className="mt-6 mb-4 text-center text-semibold" aria-live="polite" aria-atomic="true">
                {joiningRoomTitles[titleIndex].heading(participantCount)}
            </h2>
            <div className="color-weak mb-8 text-center" aria-live="polite" aria-atomic="true">
                {joiningRoomTitles[titleIndex].description}
            </div>
            <CircleLoader
                className="color-primary w-custom h-custom"
                style={{ '--w-custom': '5.3rem', '--h-custom': '5.3rem', '--stroke-width': 1.3 }}
            />
        </div>
    );
};

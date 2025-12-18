import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

interface JoiningRoomLoaderProps {
    participantCount: number | null;
}

export const JoiningRoomLoader = ({ participantCount }: JoiningRoomLoaderProps) => {
    const participantsLoaded = participantCount !== null;

    const joiningRoomTitles: { heading: (participantCount: number | null) => string; description: string }[] = [
        {
            heading: () => c('Title').t`Protecting meeting with end-to-end encryption...`,
            description: c('Description')
                .t`Setting up group end-to-end encryption with advanced Messaging Layer Security (MLS) 
`,
        },
        {
            heading: (participantCount) =>
                !participantCount
                    ? c('Title').t`Starting meeting as the first participant…`
                    : c('Title').t`Joining meeting with ${participantCount} other participants…`,
            description: !participantCount ? '' : c('Description').t`Rotating group encryption key for best security`,
        },
    ];

    const titleIndex = participantsLoaded ? 1 : 0;

    return (
        <div
            className="flex flex-column flex-nowrap items-center justify-center md:justify-start md:h-custom md:w-custom pt-6"
            style={{ '--md-w-custom': '24.625rem', '--md-h-custom': '24rem' }}
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

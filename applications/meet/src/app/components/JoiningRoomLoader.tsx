import { c, msgid } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

interface JoiningRoomLoaderProps {
    participantCount: number | null;
    header?: string;
    subtitle?: string;
}

export const JoiningRoomLoader = ({ participantCount, header, subtitle }: JoiningRoomLoaderProps) => {
    const participantsLoaded = participantCount !== null;

    const joiningRoomTitles: { heading: (participantCount: number | null) => string; description: string }[] = [
        {
            heading: () => c('Title').t`Launching Meeting...`,
            description: c('Description').t`Encrypting with Messaging Layer Security (MLS)`,
        },
        {
            heading: (participantCount) =>
                !participantCount
                    ? c('Title').t`Starting meeting as the first participant…`
                    : c('Title').ngettext(
                          msgid`Joining meeting with ${participantCount} other participant…`,
                          `Joining meeting with ${participantCount} other participants…`,
                          participantCount
                      ),
            description: !participantCount ? '' : c('Description').t`Rotating group encryption key for best security`,
        },
    ];

    const titleIndex = participantsLoaded ? 1 : 0;

    const displayHeader = header ?? joiningRoomTitles[titleIndex].heading(participantCount);
    const displaySubtitle = subtitle ?? joiningRoomTitles[titleIndex].description;

    return (
        <div
            className="flex flex-column flex-nowrap items-center justify-center md:justify-start md:h-custom md:w-custom pt-6"
            style={{ '--md-w-custom': '24.625rem', '--md-h-custom': '24rem' }}
        >
            <h2 className="mt-6 mb-4 text-center text-semibold" aria-live="polite" aria-atomic="true">
                {displayHeader}
            </h2>
            {displaySubtitle && (
                <div className="color-weak mb-8 text-center" aria-live="polite" aria-atomic="true">
                    {displaySubtitle}
                </div>
            )}
            <CircleLoader
                className="color-primary w-custom h-custom"
                style={{ '--w-custom': '5.3rem', '--h-custom': '5.3rem', '--stroke-width': 1.3 }}
            />
        </div>
    );
};

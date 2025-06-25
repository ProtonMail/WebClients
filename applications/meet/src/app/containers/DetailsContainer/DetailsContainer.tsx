import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { InputFieldTwo } from '@proton/components';
import { IcMeetCopy } from '@proton/icons';
import noop from '@proton/utils/noop';

import type { MeetingDetails } from '../../types';

import './DetailsContainer.scss';

interface DetailsContainerProps {
    meetingDetails: MeetingDetails;
}

const dateOptions: Partial<Intl.DateTimeFormatOptions> = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
};

export const DetailsContainer = ({ meetingDetails }: DetailsContainerProps) => {
    const linkWithOrigin = `${window.location.origin}${meetingDetails.meetingLink}`;

    const date = new Intl.DateTimeFormat('en-US', dateOptions).format(new Date(meetingDetails.date));

    return (
        <div className="details-container w-full h-full flex items-center justify-center">
            <div
                className="w-custom h-custom border border-strong rounded-xl p-4 flex flex-column bg-norm"
                style={{ '--w-custom': '30rem', '--h-custom': '30rem' }}
            >
                <h2 className="h2 mb-6">{meetingDetails.meetingName}</h2>

                <div className="flex flex-nowrap gap-2">
                    <div className="flex flex-column w-1/2">
                        <div>
                            <div>{c('l10n_nightly Label').t`Date & Time`}</div>
                        </div>
                        <div className="flex gap-1">
                            <span>{date}</span>
                            <span>•</span>
                            <span>{meetingDetails.time}</span>
                        </div>
                    </div>
                    <div className="flex flex-column w-1/2">
                        <div>
                            <div>{c('l10n_nightly Label').t`Duration`}</div>
                        </div>
                        <div className="flex gap-2">
                            <span>{meetingDetails.duration}</span>
                        </div>
                    </div>
                </div>
                <h3 className="h3 mb-2">{c('l10n_nightly Label').t`Meeting Link`}</h3>
                <div className="relative">
                    <InputFieldTwo className="w-full pr-6" value={linkWithOrigin} onChange={noop} />
                    <Button
                        className="absolute top-custom right-custom w-custom h-custom bg-strong rounded-full color-norm flex items-center justify-center border-none p-0"
                        style={{
                            '--top-custom': '50%',
                            '--right-custom': '0.25rem',
                            '--w-custom': '1.75rem',
                            '--h-custom': '1.75rem',
                            transform: 'translateY(-50%)',
                        }}
                        onClick={() => {
                            void navigator.clipboard.writeText(linkWithOrigin);
                        }}
                        aria-label={c('l10n_nightly Alt').t`Copy meeting link`}
                    >
                        <IcMeetCopy size={3} />
                    </Button>
                </div>
            </div>
        </div>
    );
};

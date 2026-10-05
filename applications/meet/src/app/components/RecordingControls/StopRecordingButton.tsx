import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcMeetRecordStop } from '@proton/icons/icons/IcMeetRecordStop';

import './StopRecordingButton.scss';

interface Props {
    duration: string;
    onClick: () => void;
}

export const StopRecordingButton = ({ duration, onClick }: Props) => (
    <Button
        className="stop-recording-button border-none shrink-0 px-4 h-custom"
        style={{ '--h-custom': '3.5rem' }}
        pill={true}
        onClick={onClick}
        aria-label={c('Alt').t`Stop recording and download.`}
    >
        <span className="flex items-center flex-nowrap gap-2 whitespace-nowrap">
            <IcMeetRecordStop className="shrink-0" size={5} />
            <span className="text-tabular-nums">{duration}</span>
        </span>
    </Button>
);

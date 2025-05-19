import { VideoQuality } from 'livekit-client';
import { c } from 'ttag';

import { Option, SelectTwo } from '@proton/components/index';

const qualityOptions = [
    {
        label: c('Meet').t`Low`,
        value: VideoQuality.LOW,
    },
    {
        label: c('Meet').t`Medium`,
        value: VideoQuality.MEDIUM,
    },
    {
        label: c('Meet').t`High`,
        value: VideoQuality.HIGH,
    },
];

interface QualitySelectorProps {
    value: VideoQuality;
    onChange: (value: VideoQuality) => void;
}

export const QualitySelector = ({ value, onChange }: QualitySelectorProps) => {
    return (
        <div>
            <SelectTwo value={value} onValue={onChange}>
                {qualityOptions.map((quality) => (
                    <Option key={quality.value} value={quality.value} title={quality.label} />
                ))}
            </SelectTwo>
        </div>
    );
};

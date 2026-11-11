import { c } from 'ttag';

import { IcClock } from '@proton/icons/icons/IcClock';

import { SettingsIconRow } from '../account/SettingsIconRow';
import { SettingsSelectRow, getSettingsSelectRowLabelId } from '../account/SettingsSelectRow';
import TimeFormatSelector from './TimeFormatSelector';

const TimeSection = () => {
    return (
        <SettingsIconRow icon={IcClock}>
            <SettingsSelectRow
                id="time-format-select"
                label={<SettingsSelectRow.Label>{c('Label').t`Time format`}</SettingsSelectRow.Label>}
                select={
                    <TimeFormatSelector
                        id="time-format-select"
                        aria-labelledby={getSettingsSelectRowLabelId('time-format-select')}
                    />
                }
            />
        </SettingsIconRow>
    );
};

export default TimeSection;

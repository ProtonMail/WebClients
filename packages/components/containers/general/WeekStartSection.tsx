import { c } from 'ttag';

import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';

import { SettingsIconRow } from '../account/SettingsIconRow';
import { SettingsSelectRow, getSettingsSelectRowLabelId } from '../account/SettingsSelectRow';
import WeekStartSelector from '../calendar/settings/WeekStartSelector';

const WeekStartSection = () => {
    return (
        <SettingsIconRow icon={IcCalendarGrid}>
            <SettingsSelectRow
                // WeekStartSelector owns this id on its own select
                id="week-start-select"
                label={<SettingsSelectRow.Label>{c('Label').t`Week start`}</SettingsSelectRow.Label>}
                select={<WeekStartSelector aria-labelledby={getSettingsSelectRowLabelId('week-start-select')} />}
            />
        </SettingsIconRow>
    );
};

export default WeekStartSection;

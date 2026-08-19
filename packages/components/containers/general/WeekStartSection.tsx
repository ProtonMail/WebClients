import { c } from 'ttag';

import { SettingsSelectRow } from '@proton/components/containers/account/SettingsSelectRow';
import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';

import { SettingsIconRow } from '../account/SettingsIconRow';
import WeekStartSelector from '../calendar/settings/WeekStartSelector';

const WeekStartSection = () => {
    return (
        <SettingsIconRow icon={IcCalendarGrid}>
            <SettingsSelectRow
                // WeekStartSelector owns this id on its own select
                id="week-start-select"
                label={
                    <SettingsSelectRow.Label id="label-week-start-select">
                        {c('Label').t`Week start`}
                    </SettingsSelectRow.Label>
                }
                select={<WeekStartSelector />}
            />
        </SettingsIconRow>
    );
};

export default WeekStartSection;

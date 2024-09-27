import { c } from 'ttag';

import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import WeekStartSelector from '../calendar/settings/WeekStartSelector';

const WeekStartSection = () => {
    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor="week-start-select" id="label-week-start-select">
                    {c('Label').t`Week start`}
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <WeekStartSelector />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default WeekStartSection;

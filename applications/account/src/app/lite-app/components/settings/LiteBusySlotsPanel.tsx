import { c } from 'ttag';

import useBusySlotsAvailable from '@proton/calendar-settings/hooks/useBusySlotsAvailable';
import Toggle from '@proton/components/components/toggle/Toggle';
import { CALENDAR_SHARE_BUSY_TIME_SLOTS } from '@proton/shared/lib/calendar/constants';

import LiteSettingsRow from './LiteSettingsRow';

interface Props {
    value: CALENDAR_SHARE_BUSY_TIME_SLOTS;
    onChange: (value: CALENDAR_SHARE_BUSY_TIME_SLOTS) => void;
}

/** "Show others when I'm busy" panel of the add-calendar pages, only where busy slots are available */
const LiteBusySlotsPanel = ({ value, onChange }: Props) => {
    const isBusySlotsAvailable = useBusySlotsAvailable(undefined, true);

    if (!isBusySlotsAvailable) {
        return null;
    }

    return (
        <div className="lite-settings-panel">
            <LiteSettingsRow
                htmlFor="share-busy-schedule-toggle"
                label={c('Label').t`Show others when I'm busy`}
                description={c('Info')
                    .t`Other users within your organization will see your busy slots. No event details are shared.`}
            >
                <Toggle
                    id="share-busy-schedule-toggle"
                    checked={value === CALENDAR_SHARE_BUSY_TIME_SLOTS.YES}
                    onChange={({ target }) => {
                        onChange(
                            target.checked ? CALENDAR_SHARE_BUSY_TIME_SLOTS.YES : CALENDAR_SHARE_BUSY_TIME_SLOTS.NO
                        );
                    }}
                />
            </LiteSettingsRow>
        </div>
    );
};

export default LiteBusySlotsPanel;

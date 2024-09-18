import { c } from 'ttag';

import { Info } from '@proton/components/components';
import Toggle from '@proton/components/components/toggle/Toggle';
import { CALENDAR_SHARE_BUSY_TIME_SLOTS } from '@proton/shared/lib/calendar/constants';

import useBusySlotsAvailable from '../hooks/useBusySlotsAvailable';

interface Props {
    value: CALENDAR_SHARE_BUSY_TIME_SLOTS | undefined;
    onChange: (value: CALENDAR_SHARE_BUSY_TIME_SLOTS) => void;
    disabled?: boolean;
}

export const BusySlotsLabelInfo = () => (
    <Info
        className="ml-2"
        title={c('Info').t`Other users within your organization will see your busy slots. No event details are shared.`}
    />
);

const BusySlotsLabel = () => (
    <>
        <span className="text-semibold">{c('Label').t`Show others when I'm busy`}</span>
        <BusySlotsLabelInfo />
    </>
);

const BusySlotsCheckbox = ({ value, onChange, disabled }: Props) => {
    const isBusySlotsAvailable = useBusySlotsAvailable(undefined, true);

    if (!isBusySlotsAvailable) {
        return null;
    }

    const handleChange = () => {
        onChange(
            value === CALENDAR_SHARE_BUSY_TIME_SLOTS.YES
                ? CALENDAR_SHARE_BUSY_TIME_SLOTS.NO
                : CALENDAR_SHARE_BUSY_TIME_SLOTS.YES
        );
    };

    return (
        <div className="flex">
            <div className="mr-4 cursor-pointer" onClick={handleChange}>
                <BusySlotsLabel />
            </div>
            <div>
                <Toggle
                    id="share-busy-schedule-toggle"
                    aria-describedby="busy-slots-sharing"
                    checked={value === CALENDAR_SHARE_BUSY_TIME_SLOTS.YES}
                    disabled={disabled}
                    onChange={handleChange}
                />
            </div>
        </div>
    );
};

export default BusySlotsCheckbox;

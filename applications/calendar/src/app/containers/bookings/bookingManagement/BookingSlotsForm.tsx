import { startOfWeek } from 'date-fns';

import { Button } from '@proton/atoms/Button/Button';
import DateInput from '@proton/components/components/input/DateInput';
import TimeInput from '@proton/components/components/input/TimeInput';
import { IcPlus, IcTrash } from '@proton/icons';
import { MAXIMUM_DATE } from '@proton/shared/lib/calendar/constants';

export const BookingSlotsForm = () => {
    const now = new Date();
    const start = startOfWeek(now);

    return (
        <>
            <div className="flex items-center justify-space-between">
                <div className="flex items-center gap-0.5">
                    <p className="m-0 text-sm text-semibold color-weak">Mon</p>
                    <div
                        className="flex *:min-size-auto flex-1 flex-column grow-custom"
                        style={{ '--grow-custom': '1.35' }}
                    >
                        <DateInput
                            id="date-input"
                            className="flex-1"
                            required
                            value={now}
                            onChange={() => {}}
                            // displayWeekNumbers={displayWeekNumbers}
                            // weekStartsOn={weekStartsOn}
                            min={start}
                            max={MAXIMUM_DATE}
                        />
                    </div>
                    <TimeInput id="event-startTime" className="ml-2 flex-1" value={now} onChange={() => {}} />
                    <TimeInput id="event-endTime" className="ml-2 flex-1" value={now} onChange={() => {}} />
                </div>
                <div className="flex gap-2">
                    <Button icon shape="ghost" onClick={() => {}}>
                        <IcPlus className="color-norm" />
                    </Button>
                    <Button icon shape="ghost" onClick={() => {}}>
                        <IcTrash className="color-weak" />
                    </Button>
                </div>
            </div>
        </>
    );
};

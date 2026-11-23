import { clsx } from 'clsx';
import { c } from 'ttag';

import { isDesktopEnvironment } from '@proton/lumo-api-client/core/desktop-tools';

import { useLumoFlags } from '../../../../../hooks/useLumoFlags';
import type { CreateScheduleToolResponse } from '../../../../../types';
import { LumoLink } from '../../../../Links/LumoLink';
import { LumoIcon } from '../../../../LumoIcon/LumoIcon';

import './CreateScheduleResponseMessage.scss';

/** Display the user's response to a schedule draft without interpreting task names as Markdown. */
export const CreateScheduleResponseMessage = ({
    createScheduleToolResponse,
}: {
    createScheduleToolResponse: CreateScheduleToolResponse;
}) => {
    const { scheduleId, name, metadataLabel, cancelled } = createScheduleToolResponse;
    const { schedules: schedulesFlag } = useLumoFlags();
    const headings = {
        // translator: Heading for a cancelled schedule draft. ${name} is the task's user-visible name.
        cancelled: c('collider_2025:Title').t`Schedule draft cancelled · ${name}`,
        // translator: Confirmation heading (past tense). ${name} is the name of the task the user has just scheduled.
        saved: c('collider_2025:Title').t`Scheduled · ${name}`,
    };

    return (
        <div className="create-schedule-response-message flex flex-column flex-nowrap items-start gap-2 w-full min-h-custom p-4 border radius-16 lumo-bg-panel sm:flex-row sm:items-center sm:gap-3">
            <div className="create-schedule-response-message__header flex flex-nowrap items-center gap-3">
                <LumoIcon
                    aria-hidden
                    className={cancelled ? 'shrink-0 lumo-color-glyph-mid' : 'shrink-0 lumo-color-signal-success'}
                    name={cancelled ? 'StickyNoteX' : 'CircleCheck'}
                    size={16}
                />
                <p
                    className={clsx(
                        'm-0 text-break text-ellipsis-two-lines',
                        cancelled ? 'lumo-body-medium lumo-color-glyph-mid' : 'lumo-title-small'
                    )}
                >
                    {headings[cancelled ? 'cancelled' : 'saved']}
                </p>
            </div>

            {metadataLabel && (
                <div className="create-schedule-response-message__metadata lumo-body-small text-ellipsis-two-lines lumo-color-glyph-mid">
                    {metadataLabel}
                </div>
            )}

            {schedulesFlag && isDesktopEnvironment() && scheduleId && !cancelled && (
                <LumoLink
                    aria-label={
                        // translator: Accessible name for the link to a saved task. ${name} is the task's user-visible name.
                        c('collider_2025:Action').t`Open scheduled task: ${name}`
                    }
                    className="flex flex-nowrap shrink-0 items-center gap-1 pl-0.5 border border-transparent radius-4 bg-transparent interactive"
                    to={`/schedules/${scheduleId}`}
                >
                    <span className="lumo-color-glyph-brand-text">{
                        // translator: Link to view the saved scheduled task and its settings.
                        c('collider_2025:Action').t`Open task`
                    }</span>
                    <LumoIcon aria-hidden className="lumo-color-glyph-brand-text" name="ChevronRight" size={14} />
                </LumoLink>
            )}
        </div>
    );
};

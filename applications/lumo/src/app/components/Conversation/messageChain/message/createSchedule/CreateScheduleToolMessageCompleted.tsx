import { useId, useState } from 'react';

import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { Scroll } from '@proton/atoms/Scroll/Scroll';
import Toggle from '@proton/components/components/toggle/Toggle';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';

import type { CreateScheduleToolArguments } from '../../../../../features/client-tools/createScheduleTool/createScheduleTool';
import { ConnectorList } from '../../../../../features/schedules/components/ConnectorList';
import { getScheduleCadenceLabel } from '../../../../../features/schedules/components/utils/cadence-label';
import { getScheduleDetailsValidationErrors } from '../../../../../features/schedules/components/utils/schedules';
import type { ScheduleDetails } from '../../../../../features/schedules/types';
import { useConversationActions } from '../../../../../providers/ConversationActionsProvider';
import { useWebSearch } from '../../../../../providers/WebSearchProvider';
import { useLumoDispatch } from '../../../../../redux/hooks';
import { newSpaceId } from '../../../../../redux/slices/core/spaces';
import { saveSchedule } from '../../../../../redux/slices/schedules';
import { LumoIcon } from '../../../../LumoIcon/LumoIcon';
import { ALWAYS_LOCAL_TIMEZONE_ID } from '../../../../RecurrenceRuleFieldset/types';

import './CreateScheduleToolMessageCompleted.scss';

function getScheduleMetadataLabel(
    schedule: Pick<ScheduleDetails, 'recurrenceRule' | 'autoApprove'>,
    weekStartsOn: WeekStartsOn
): string {
    const cadenceLabel = getScheduleCadenceLabel(schedule.recurrenceRule, weekStartsOn);
    const timezoneLabel =
        schedule.recurrenceRule.timezone === ALWAYS_LOCAL_TIMEZONE_ID ? '' : ` (${schedule.recurrenceRule.timezone})`;
    const autoApproveLabels = {
        // translator: Status label: automatic approval of the task's allowed external tools is enabled.
        on: c('collider_2025:Label').t`Auto-approve on`,
        // translator: Status label: automatic approval is disabled; tool actions may require confirmation.
        off: c('collider_2025:Label').t`Auto-approve off`,
    };

    return `${cadenceLabel}${timezoneLabel} · ${autoApproveLabels[schedule.autoApprove ? 'on' : 'off']}`;
}

/** Review a validated draft and send the user's save or cancel response. */
export const CreateScheduleToolMessageCompleted = ({ draft }: { draft: CreateScheduleToolArguments }) => {
    const id = useId();
    const dispatch = useLumoDispatch();
    const [userSettings] = useUserSettings();
    const { handleSendCreateScheduleToolResponse } = useConversationActions();
    const { isWebSearchButtonToggled } = useWebSearch();
    const { createNotification } = useNotifications();
    const [isClosed, setIsClosed] = useState(false);

    const [schedule, setSchedule] = useState<ScheduleDetails>(() => ({
        name: draft.name,
        instructions: draft.instructions,
        recurrenceRule: draft.recurrenceRule,
        autoApprove: true,
        notifyOnComplete: true,
        connectors: draft.connectors.map((id) => ({ id, label: id })),
    }));
    const [showDetails, setShowDetails] = useState(true);
    const cadenceLabel = getScheduleCadenceLabel(schedule.recurrenceRule, getWeekStartsOn(userSettings));
    const taskName = schedule.name;

    if (isClosed) return null;

    const handleSave = () => {
        const errors = getScheduleDetailsValidationErrors(schedule);
        const error = Object.values(errors)[0];
        if (error) {
            createNotification({ text: error, type: 'error' });
            return;
        }

        const savedSchedule = { ...schedule, name: schedule.name.trim(), instructions: schedule.instructions.trim() };
        const scheduleId = newSpaceId();
        try {
            // Generate the schedule id locally when the user confirms the draft.
            dispatch(saveSchedule(scheduleId, savedSchedule));
        } catch (error) {
            // translator: Error notification when a scheduled task cannot be saved.
            const fallbackMessage = c('collider_2025:Error')
                .t`Could not save this task. Reload the page and try again.`;
            createNotification({ text: error instanceof Error ? error.message : fallbackMessage, type: 'error' });
            return;
        }

        const metadataLabel = getScheduleMetadataLabel(savedSchedule, getWeekStartsOn(userSettings));

        setIsClosed(true);
        void handleSendCreateScheduleToolResponse(
            { scheduleId, name: savedSchedule.name, metadataLabel },
            isWebSearchButtonToggled
        );
    };

    const handleCancel = () => {
        setIsClosed(true);
        void handleSendCreateScheduleToolResponse({ name: draft.name, cancelled: true }, isWebSearchButtonToggled);
    };

    return (
        <section
            aria-labelledby={`${id}-title`}
            className="create-schedule-card flex flex-column flex-nowrap gap-4 w-full p-5 rounded-xl bg-norm"
        >
            <div className="flex flex-nowrap shrink-0 items-center gap-2 min-w-0">
                <LumoIcon aria-hidden className="shrink-0" name="Clock" size={14} />
                <h3 className="shrink-0 m-0 text-rg text-semibold" id={`${id}-title`}>{
                    // translator: Heading inviting the user to schedule a recurring or one-time task (imperative).
                    c('collider_2025:Title').t`Schedule task`
                }</h3>
                <span aria-hidden className="color-weak">
                    ·
                </span>
                <span className="min-w-0 text-break">{schedule.name}</span>
            </div>

            <Scroll className="create-schedule-card__body flex flex-column flex-nowrap overflow-hidden" scrollContained>
                <div className="flex flex-column flex-nowrap gap-4">
                    <div className="text-rg">
                        {cadenceLabel}
                        {schedule.recurrenceRule.timezone !== ALWAYS_LOCAL_TIMEZONE_ID &&
                            ` (${schedule.recurrenceRule.timezone})`}
                    </div>

                    <div className="flex flex-nowrap items-center gap-4 px-4 py-3 border border-weak rounded-xl">
                        <div className="flex flex-column flex-1 gap-0.5 min-w-0">
                            <span className="create-schedule-card__auto-approve-label" id={`${id}-auto-approve-label`}>{
                                // translator: Toggle label. When on, the scheduled task can use allowed external tools without asking the user to approve each action.
                                c('collider_2025:Title').t`Auto-approve`
                            }</span>
                            <span className="text-sm color-weak" id={`${id}-auto-approve-description`}>{
                                // translator: Explains the Auto-approve toggle. Connectors provide access to external tools and services; "Off" means the toggle is switched off.
                                c('collider_2025:Description')
                                    .t`Run without asking, using only the connectors you allow. Off: pause and notify you before each tool that requires confirmation.`
                            }</span>
                        </div>
                        <Toggle
                            aria-describedby={`${id}-auto-approve-description`}
                            aria-labelledby={`${id}-auto-approve-label`}
                            checked={schedule.autoApprove}
                            className="shrink-0"
                            id={`${id}-auto-approve`}
                            onChange={() => setSchedule((value) => ({ ...value, autoApprove: !value.autoApprove }))}
                        />
                    </div>

                    <ConnectorList
                        compact
                        editMode
                        header={
                            // translator: Introduces the external tools and services the task uses. "Uses" is a present-tense verb with the task as its subject, not a plural noun or a command.
                            c('collider_2025:Label').t`Uses`
                        }
                        headerClassName="color-hint"
                        onChange={(connectors) => setSchedule((value) => ({ ...value, connectors }))}
                        value={schedule.connectors}
                    />

                    <Button
                        aria-controls={`${id}-details`}
                        aria-expanded={showDetails}
                        className="create-schedule-card__details-button flex flex-nowrap shrink-0 items-center justify-start gap-1.5 p-0 rounded-lg text-sm text-nowrap color-hint bg-transparent hover:color-weak"
                        onClick={() => setShowDetails((value) => !value)}
                        shape="ghost"
                        size="small"
                    >
                        <LumoIcon
                            aria-hidden
                            className="shrink-0"
                            name={showDetails ? 'ChevronDown' : 'ChevronRight'}
                            size={12}
                        />
                        <span>{
                            // translator: Disclosure label for the proposed task instructions. "Details" is a plural noun, not a command.
                            c('collider_2025:Label').t`Details`
                        }</span>
                    </Button>
                    <div
                        className="create-schedule-card__instructions mb-1 p-4 border border-weak rounded-xl text-sm text-break text-pre-wrap color-weak"
                        hidden={!showDetails}
                        id={`${id}-details`}
                    >
                        {schedule.instructions}
                    </div>
                </div>
            </Scroll>

            <div className="flex gap-2">
                <Button
                    aria-label={
                        // translator: Button to schedule the task (imperative). ${taskName} is the user-visible task name.
                        c('collider_2025:Action').t`Schedule task: ${taskName}`
                    }
                    color="norm"
                    onClick={handleSave}
                    type="button"
                >{
                    // translator: Button to schedule the reviewed task (imperative).
                    c('collider_2025:Button').t`Schedule`
                }</Button>
                <Button onClick={handleCancel} type="button">{
                    // translator: Button that cancels the current action and closes the editor or dialog without applying changes.
                    c('collider_2025:Button').t`Cancel`
                }</Button>
            </div>
        </section>
    );
};

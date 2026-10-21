import type { IconName } from '../../components/LumoIcon/LumoIcon';
import type { RecurrenceRule } from '../../components/RecurrenceRuleFieldset/types';

/** A connector that can be used during a run. */
export interface ScheduleConnector {
    /** The unique identifier for the connector. */
    id: string;
    /** The label to display for the connector. */
    label: string;
    /** The icon URL returned by the Desktop bridge, when available. */
    icon?: string;
}

/** The details of a scheduled task. */
export interface ScheduleDetails {
    /** The unique identifier for the scheduled task. */
    id: string;
    /** Name for the scheduled task. */
    name: string;
    /** Prompt Lumo executes on every run for the scheduled task. */
    instructions: string;
    /** Schedule timing: once or repeating, wall-clock hour/minute, timezone, plus weekday or month-day picks. */
    recurrenceRule: RecurrenceRule;
    /** Allowlisted connectors that can be used during a run. */
    connectors: ScheduleConnector[];
    /** When true, allowed connectors run without confirmation; when false, Lumo pauses before each Ask tool. */
    autoApprove: boolean;
    /** When true, show a notification after a run completes successfully. */
    notifyOnComplete: boolean;
}

/** A template for a scheduled task. */
export interface ScheduleTemplate extends Omit<ScheduleDetails, 'autoApprove' | 'notifyOnComplete' | 'id'> {
    /** A short description of the schedule template. */
    description: string;
    /** The recurrence rule label to display for the schedule in the schedule template list (e.g. "Every Friday at 4:00 PM"). */
    scheduleLabel: string;
    /** The icon to display for the schedule in the schedule template list. */
    icon: IconName;
}

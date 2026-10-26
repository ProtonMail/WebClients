import type { ScheduleDetails } from '../../features/schedules/types';

export const createTestSchedule = (overrides: Partial<ScheduleDetails> = {}): ScheduleDetails => ({
    name: 'Daily briefing',
    instructions: 'Summarize my day',
    recurrenceRule: { frequency: 'WEEKLY', byWeekDay: ['MO', 'FR'], hour: 9, minute: 15, timezone: 'Asia/Taipei' },
    connectors: [{ id: 'mail', label: 'Mail', icon: 'mail' }],
    autoApprove: false,
    notifyOnComplete: true,
    ...overrides,
});

export const MOCK_SCHEDULE_TEMPLATES = [
    {
        id: 'daily-briefing',
        title: 'Daily briefing',
        description: 'What needs your attention today across calendar, email, and messages.',
        scheduleLabel: 'Weekdays at 8:00 AM',
        icon: 'Sunrise',
    },
    {
        id: 'inbox-triage',
        title: 'Inbox triage',
        description: 'Sort your Proton Mail inbox and draft replies to anything urgent.',
        scheduleLabel: 'Weekdays at 8:00 AM',
        icon: 'Inbox',
    },
    {
        id: 'meeting-prep',
        title: 'Meeting prep',
        description: 'A short brief before each meeting on your calendar: attendees, context, agenda.',
        scheduleLabel: 'Weekdays at 8:00 AM',
        icon: 'Calendar',
    },
    {
        id: 'weekly-review',
        title: 'Weekly review',
        description: 'A Friday summary of what you worked on this week.',
        scheduleLabel: 'Every Friday at 4:00 PM',
        icon: 'ListChecks',
    },
    {
        id: 'content-ideas',
        title: 'Content ideas',
        description: 'Draft a few post ideas each week from the latest news in your industry.',
        scheduleLabel: 'Every Monday at 9:00 AM',
        icon: 'Lightbulb',
    },
    {
        id: 'monitor-topic',
        title: 'Monitor a topic',
        description: 'Watch for news or mentions of a topic, competitor, or keyword.',
        scheduleLabel: 'Daily at 9:00 AM',
        icon: 'Binoculars',
    },
] as const;

import type { DesktopConnector } from '@proton/lumo-api-client/core/desktop-tools';

import { ALWAYS_LOCAL_TIMEZONE_ID } from '../../components/RecurrenceRuleFieldset/types';
import type { ScheduleConnector, ScheduleTemplate } from './types';

export const getScheduleTemplates = (manifests: readonly DesktopConnector[] = []): ScheduleTemplate[] => {
    const getConnector = (id: string, label: string): ScheduleConnector => {
        const manifest = manifests.find((connector) => connector.id === id);
        return { id, label: manifest?.display_name ?? label, icon: manifest?.icon ?? undefined };
    };

    // Keep template suggestions even when a connector has not been registered or set up yet.
    const mailConnector = getConnector('proton_mail', 'Proton Mail');
    const slackConnector = getConnector('mcp-slack', 'Slack');
    const browserConnector = getConnector('browser', 'Browser');

    return [
        {
            name: 'Daily briefing',
            icon: 'Sunrise',
            description: 'What needs your attention today across calendar, email, and messages.',
            instructions:
                "Give me a short, scannable morning brief: today's calendar (with tomorrow for context), important unread emails, Slack mentions, and anything due today. Use bullet points and lead with what needs my action first.",
            scheduleLabel: 'Weekdays at 8:00 AM',
            recurrenceRule: {
                frequency: 'WEEKLY',
                byWeekDay: ['MO', 'TU', 'WE', 'TH', 'FR'],
                hour: 8,
                minute: 0,
                timezone: ALWAYS_LOCAL_TIMEZONE_ID,
            },
            connectors: [mailConnector, slackConnector],
        },
        {
            name: 'Inbox triage',
            icon: 'Inbox',
            description: 'Sort your Proton Mail inbox and draft replies to anything urgent.',
            instructions:
                'Review my Proton Mail inbox. Group messages by urgency, summarize what needs a reply today, and draft concise replies for the top urgent threads. Do not send anything—show drafts for my review.',
            scheduleLabel: 'Weekdays at 8:00 AM',
            recurrenceRule: {
                frequency: 'WEEKLY',
                byWeekDay: ['MO', 'TU', 'WE', 'TH', 'FR'],
                hour: 8,
                minute: 0,
                timezone: ALWAYS_LOCAL_TIMEZONE_ID,
            },
            connectors: [mailConnector],
        },
        {
            name: 'Meeting prep',
            icon: 'Calendar',
            description: 'A short brief before each meeting on your calendar: attendees, context, agenda.',
            instructions:
                'For each meeting on my calendar in the next 24 hours, give a one-paragraph brief: time, attendees, purpose, relevant email or Slack context, and suggested talking points. Skip meetings I declined.',
            scheduleLabel: 'Weekdays at 8:00 AM',
            recurrenceRule: {
                frequency: 'WEEKLY',
                byWeekDay: ['MO', 'TU', 'WE', 'TH', 'FR'],
                hour: 8,
                minute: 0,
                timezone: ALWAYS_LOCAL_TIMEZONE_ID,
            },
            connectors: [mailConnector, slackConnector],
        },
        {
            name: 'Weekly review',
            icon: 'ListChecks',
            description: 'A Friday summary of what you worked on this week.',
            instructions:
                'Summarize my week: major meetings, email threads I handled, open loops still pending, and wins worth noting. End with three priorities for Monday. Keep it under one screen.',
            scheduleLabel: 'Every Friday at 4:00 PM',
            recurrenceRule: {
                frequency: 'WEEKLY',
                byWeekDay: ['FR'],
                hour: 16,
                minute: 0,
                timezone: ALWAYS_LOCAL_TIMEZONE_ID,
            },
            connectors: [mailConnector],
        },
        {
            name: 'Content ideas',
            icon: 'Lightbulb',
            description: 'Draft a few post ideas each week from the latest news in your industry.',
            instructions:
                'Find recent news in my industry from the past week. Propose five short post ideas (headline + two-sentence angle each) suited for LinkedIn or a company blog. Note the source for each idea.',
            scheduleLabel: 'Every Monday at 9:00 AM',
            recurrenceRule: {
                frequency: 'WEEKLY',
                byWeekDay: ['MO'],
                hour: 9,
                minute: 0,
                timezone: ALWAYS_LOCAL_TIMEZONE_ID,
            },
            connectors: [browserConnector],
        },
        {
            name: 'Monitor a topic',
            icon: 'Binoculars',
            description: 'Watch for news or mentions of a topic, competitor, or keyword.',
            instructions:
                'Search for notable news and public mentions from the last 24 hours about [topic, competitor, or keyword]. List only new or meaningful updates with links, one line each, and flag anything that needs a response.',
            scheduleLabel: 'Daily at 9:00 AM',
            recurrenceRule: {
                frequency: 'DAILY',
                hour: 9,
                minute: 0,
                timezone: ALWAYS_LOCAL_TIMEZONE_ID,
            },
            connectors: [browserConnector],
        },
    ];
};

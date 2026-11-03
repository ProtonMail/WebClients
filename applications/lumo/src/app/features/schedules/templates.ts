import { c } from 'ttag';

import type { DesktopConnector } from '@proton/lumo-api-client/core/desktop-tools';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

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
            // translator: Suggested scheduled task title.
            name: c('collider_2025:Title').t`Plan your day`,
            icon: 'Sunrise',
            // translator: Description of a suggested scheduled task.
            description: c('collider_2025:Description')
                .t`Start each morning with your schedule, priorities, and updates in one place.`,
            // translator: Editable prompt for a task that helps the user plan their day.
            instructions: c('collider_2025:Prompt')
                .t`Help me plan my day. Bring together today's schedule, priorities, important unread emails, and Slack updates in a short morning brief. Highlight anything due today, suggest what to focus on first, and include tomorrow's schedule when it helps me prepare.`,
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
            // translator: Suggested scheduled task title.
            name: c('collider_2025:Title').t`Focus your inbox`,
            icon: 'Inbox',
            // translator: Description of a suggested scheduled task. ${MAIL_APP_NAME} is the product name.
            description: c('collider_2025:Description')
                .t`See which ${MAIL_APP_NAME} emails need a reply and draft responses in your voice.`,
            // translator: Editable prompt for an inbox task. ${MAIL_APP_NAME} is the product name.
            instructions: c('collider_2025:Prompt')
                .t`Review my ${MAIL_APP_NAME} inbox and identify emails that need a reply. Prioritize the messages that need my attention today and draft concise responses in my voice, using the conversation for context. Show the drafts for my review without sending anything.`,
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
            // translator: Suggested scheduled task title.
            name: c('collider_2025:Title').t`Prepare ahead`,
            icon: 'Calendar',
            // translator: Description of a suggested scheduled task.
            description: c('collider_2025:Description')
                .t`Catch up on key details and talking points before your next scheduled meeting.`,
            // translator: Editable prompt for preparing for upcoming meetings.
            instructions: c('collider_2025:Prompt')
                .t`Help me prepare for my next scheduled meetings. Review my calendar for the next 24 hours and summarize each meeting's time, attendees, purpose, and key details from relevant emails or Slack messages. Suggest talking points and anything I should prepare beforehand. Skip meetings I declined.`,
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
            // translator: Suggested scheduled task title.
            name: c('collider_2025:Title').t`Review your week`,
            icon: 'ListChecks',
            // translator: Description of a suggested scheduled task.
            description: c('collider_2025:Description')
                .t`Summarize what you achieved, what is still open, and what comes next.`,
            // translator: Editable prompt for reviewing the user's week and planning what comes next.
            instructions: c('collider_2025:Prompt')
                .t`Help me review my week. Summarize what I achieved, the important conversations and decisions, and anything still open or waiting for a reply. Highlight wins and unfinished work, then suggest three priorities for next week. Keep the review short and easy to scan.`,
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
            // translator: Suggested scheduled task title.
            name: c('collider_2025:Title').t`Spark new ideas`,
            icon: 'Lightbulb',
            // translator: Description of a suggested scheduled task.
            description: c('collider_2025:Description')
                .t`Explore fresh angles for content and campaigns that speak to your audience.`,
            // translator: Editable prompt for brainstorming content and campaign ideas. Square brackets mark details the user can customize.
            instructions: c('collider_2025:Prompt')
                .t`Help me find fresh ideas for content and campaigns about [topic or industry] for [audience]. Explore recent news, trends, and useful questions, then suggest five ideas that would resonate with this audience. Give each idea a headline, a short explanation of the angle, and links to any sources that inspired it.`,
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
            // translator: Suggested scheduled task title.
            name: c('collider_2025:Title').t`Follow a topic`,
            icon: 'Binoculars',
            // translator: Description of a suggested scheduled task.
            description: c('collider_2025:Description')
                .t`Get the latest news and developments on the subjects you care about.`,
            // translator: Editable prompt for following news about a subject. Square brackets mark a topic the user can customize.
            instructions: c('collider_2025:Prompt')
                .t`Keep me up to date on [topic or subject]. Find the latest news and developments from the last 24 hours, summarize the meaningful updates, and explain why they matter. Include links to sources and highlight anything I may want to follow up on.`,
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

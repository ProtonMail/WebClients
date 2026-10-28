import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { fireEvent, render, screen } from '@testing-library/react';

import { useLumoMemoSelector, useLumoSelector } from '../../../redux/hooks';
import type { Conversation } from '../../../types';
import { useRunScheduleNow } from '../useRunScheduleNow';
import { ScheduledTaskRunPanel } from './ScheduledTaskRunPanel';

jest.mock('../../../components/Files/KnowledgeBase/KnowledgeBasePanel', () => ({
    KnowledgeBasePanel: ({ children, headerActions }: { children: ReactNode; headerActions: ReactNode }) => (
        <div>
            {headerActions}
            {children}
        </div>
    ),
}));
jest.mock('../../../redux/hooks', () => ({ useLumoMemoSelector: jest.fn(), useLumoSelector: jest.fn() }));
jest.mock('../useRunScheduleNow', () => ({
    useRunScheduleNow: jest.fn(),
}));

describe('ScheduledTaskRunPanel', () => {
    it('shows inline history labels and preserves the current selection', () => {
        const runNow = jest.fn();
        jest.mocked(useRunScheduleNow).mockReturnValue({ runNow, loading: false, disabled: false });
        const at = '2026-10-27T09:00:00Z';
        const run = {
            runId: 'run',
            scheduleId: 'schedule',
            timingRevision: 1,
            scheduledFor: at,
            updatedAt: at,
            status: 'pending' as const,
        };
        const conversation = {
            id: 'conversation',
            spaceId: 'schedule',
            createdAt: at,
            scheduleRun: { run, status: 'succeeded', messageIds: [] },
        } as unknown as Conversation;
        const manual = {
            ...conversation,
            id: 'manual',
            scheduleRun: { ...conversation.scheduleRun!, run: { ...run, runId: 'manual', manual: true } },
        };
        jest.mocked(useLumoMemoSelector).mockReturnValue({ conversation, manual });
        jest.mocked(useLumoSelector).mockReturnValue({});
        render(
            <MemoryRouter
                initialEntries={[{ pathname: '/c/conversation', state: { expandedScheduleRuns: 'schedule' } }]}
            >
                <ScheduledTaskRunPanel
                    conversation={conversation}
                    scheduleName="Morning brief"
                    messageChain={[]}
                    artifacts={[]}
                    onOpenArtifact={jest.fn()}
                    onClose={jest.fn()}
                />
            </MemoryRouter>
        );
        expect(screen.getByRole('button', { name: 'Runs 2' })).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('link', { name: /On schedule/ })).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('link', { name: /Ran manually/ })).not.toHaveAttribute('aria-current');
        fireEvent.click(screen.getByRole('button', { name: 'Run now' }));
        expect(runNow).toHaveBeenCalledTimes(1);
    });
});

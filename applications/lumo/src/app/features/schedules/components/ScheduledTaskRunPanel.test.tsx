import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { fireEvent, render, screen } from '@testing-library/react';

import { useLumoMemoSelector, useLumoSelector } from '../../../redux/hooks';
import type { Conversation } from '../../../types';
import { useRunScheduleNow } from '../useRunScheduleNow';
import { ScheduledTaskRunPanel } from './ScheduledTaskRunPanel';

vi.mock('../../../components/Files/KnowledgeBase/KnowledgeBasePanel', () => ({
    KnowledgeBasePanel: ({ children, headerActions }: { children: ReactNode; headerActions: ReactNode }) => (
        <div>
            {headerActions}
            {children}
        </div>
    ),
}));
vi.mock('../../../redux/hooks', () => ({ useLumoMemoSelector: vi.fn(), useLumoSelector: vi.fn() }));
vi.mock('../useRunScheduleNow', () => ({
    useRunScheduleNow: vi.fn(),
}));

describe('ScheduledTaskRunPanel', () => {
    it('shows inline history labels and preserves the current selection', () => {
        const runNow = vi.fn();
        vi.mocked(useRunScheduleNow).mockReturnValue({ runNow, loading: false, disabled: false });
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
        vi.mocked(useLumoMemoSelector).mockReturnValue({ conversation, manual });
        vi.mocked(useLumoSelector).mockReturnValue({});
        render(
            <MemoryRouter
                initialEntries={[{ pathname: '/c/conversation', state: { expandedScheduleRuns: 'schedule' } }]}
            >
                <ScheduledTaskRunPanel
                    conversation={conversation}
                    scheduleName="Morning brief"
                    messageChain={[]}
                    artifacts={[]}
                    onOpenArtifact={vi.fn()}
                    onClose={vi.fn()}
                />
            </MemoryRouter>
        );
        // The count is an inline span right after the label, so nothing separates them in the name.
        expect(screen.getByRole('button', { name: 'Runs 2' })).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('link', { name: /On schedule/ })).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('link', { name: /Ran manually/ })).not.toHaveAttribute('aria-current');
        fireEvent.click(screen.getByRole('button', { name: 'Run now' }));
        expect(runNow).toHaveBeenCalledTimes(1);
    });
});

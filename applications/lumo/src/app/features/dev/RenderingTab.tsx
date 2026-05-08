import { useState } from 'react';

import { c } from 'ttag';

import { generateSpaceKeyBase64 } from '../../crypto';
import { useLumoDispatch } from '../../redux/hooks';
import { addConversation } from '../../redux/slices/core/conversations';
import { addSpace, newSpaceId } from '../../redux/slices/core/spaces';
import type { Conversation, Space } from '../../types';
import { ConversationStatus } from '../../types';
import { TestRendererModal } from './TestRendererModal';

export const RenderingTab = () => {
    const dispatch = useLumoDispatch();
    const [showTestRenderer, setShowTestRenderer] = useState(false);

    const handleCreateTestChats = () => {
        const now = new Date();
        const testSpaceId = newSpaceId();
        const spaceKey = generateSpaceKeyBase64();

        const testSpace: Space = {
            id: testSpaceId,
            createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            spaceKey,
            isProject: true,
            projectName: 'Test Space (Expiring Chats)',
            projectIcon: 'test',
        };

        dispatch(addSpace(testSpace));

        const testConversations: Conversation[] = [
            {
                id: newSpaceId(),
                spaceId: testSpaceId,
                title: 'Recent conversation about React hooks',
                createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
                starred: false,
                status: ConversationStatus.COMPLETED,
            },
            {
                id: newSpaceId(),
                spaceId: testSpaceId,
                title: 'Help with TypeScript generics',
                createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                starred: false,
                status: ConversationStatus.COMPLETED,
            },
            {
                id: newSpaceId(),
                spaceId: testSpaceId,
                title: 'Database optimization strategies',
                createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                starred: false,
                status: ConversationStatus.COMPLETED,
            },
            {
                id: newSpaceId(),
                spaceId: testSpaceId,
                title: 'API design best practices',
                createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
                starred: false,
                status: ConversationStatus.COMPLETED,
            },
            {
                id: newSpaceId(),
                spaceId: testSpaceId,
                title: 'CSS Grid vs Flexbox comparison',
                createdAt: new Date(now.getTime() - 6.9 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(now.getTime() - 6.9 * 24 * 60 * 60 * 1000).toISOString(),
                starred: false,
                status: ConversationStatus.COMPLETED,
            },
            {
                id: newSpaceId(),
                spaceId: testSpaceId,
                title: 'Docker container networking',
                createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
                starred: false,
                status: ConversationStatus.COMPLETED,
            },
        ];

        testConversations.forEach((conv) => {
            dispatch(addConversation(conv));
        });

        alert(
            `Created ${testConversations.length} test conversations!\n\nCheck the sidebar to see:\n- Today section (1 chat)\n- Last 7 days (1 chat)\n- Expiring Soon (3 chats) ⚠️\n- Last 30 days (1 chat - hidden for free users)`
        );
    };

    return (
        <>
            <div className="debug-view-tab-panel debug-view-actions">
                <button
                    className="debug-view-btn debug-view-btn--primary"
                    onClick={() => setShowTestRenderer(true)}
                    style={{ background: 'var(--interaction-norm)' }}
                >
                    🧪 {c('lumo: Debug View').t`Test Renderer`}
                </button>
                <button
                    className="debug-view-btn debug-view-btn--primary"
                    onClick={handleCreateTestChats}
                    style={{ background: 'var(--signal-warning)' }}
                >
                    ⚠️ {c('lumo: Debug View').t`Create Test Chats`}
                </button>
                <div className="debug-view-hint">
                    {c('lumo: Debug View')
                        .t`Spin up the test renderer or seed the sidebar with conversations across age buckets.`}
                </div>
            </div>
            {showTestRenderer && (
                <TestRendererModal open={showTestRenderer} onClose={() => setShowTestRenderer(false)} />
            )}
        </>
    );
};

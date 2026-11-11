import { act, renderHook } from '@testing-library/react';

import { selectProvisionalAttachments } from '../../../redux/selectors';
import attachmentsReducer, {
    type AttachmentMap,
    clearProvisionalAttachments,
    deleteAttachment,
    upsertAttachment,
} from '../../../redux/slices/core/attachments';
import type { LumoState } from '../../../redux/store';
import type { LumoFile } from '../../../remote/nativeComposerBridge';
import { attachmentDataCache } from '../../../services/attachmentDataCache';
import { type Attachment, ComposerMode } from '../../../types';
import { useNativeComposerFileApi } from './useNativeComposerFileApi';

const file = (id: string, extra: Partial<Attachment> = {}): Attachment => ({
    id,
    filename: `${id}.txt`,
    mimeType: 'text/plain',
    uploadedAt: '2026-11-11T00:00:00Z',
    ...extra,
});
const nativeStates = (): { attachedFiles: LumoFile[] }[] =>
    (window as any).Android.onStateChange.mock.calls.map(([json]: [string]) => JSON.parse(json));
const bridge = () => (window as any).nativeComposerApiInstance;
const ids = () =>
    bridge()
        .getState()
        .attachedFiles.map((f: { id: string }) => f.id);

function mountComposer(initial: AttachmentMap = {}) {
    let attachments = initial;
    const { rerender, unmount } = renderHook(
        ({ files }) =>
            useNativeComposerFileApi(
                ComposerMode.CONVERSATION,
                selectProvisionalAttachments({ attachments: files } as LumoState),
                true,
                jest.fn(),
                jest.fn(),
                jest.fn(),
                (id) => dispatch(deleteAttachment(id))
            ),
        { initialProps: { files: attachments } }
    );
    function dispatch(action: Parameters<typeof attachmentsReducer>[1]) {
        act(() => {
            attachments = attachmentsReducer(attachments, action);
            rerender({ files: attachments });
        });
    }
    return { dispatch, unmount };
}

beforeEach(() => {
    (window as any).Android = { onStateChange: jest.fn() };
    bridge().clearFiles();
    attachmentDataCache.clear();
});

afterEach(() => {
    delete (window as any).Android;
});

it('does not publish retrieved project files or previous conversation context as draft attachments', () => {
    const { dispatch } = mountComposer();
    dispatch(upsertAttachment(file('project', { spaceId: 'project-13', autoRetrieved: true })));
    dispatch(upsertAttachment(file('history', { conversationContext: true })));
    expect(ids()).toEqual([]);
    expect(nativeStates().every((state) => state.attachedFiles.length === 0)).toBe(true);
});

it('restores only completed draft files on mount and clears them on unmount', () => {
    const { unmount } = mountComposer({
        draft: file('draft'),
        pending: file('pending', { processing: true }),
        project: file('project', { spaceId: 'project-13' }),
    });
    expect(ids()).toEqual(['draft']);
    unmount();
    expect(ids()).toEqual([]);
});

it('removes a sent file when it gains a space without removing another draft file', () => {
    const { dispatch } = mountComposer();
    dispatch(upsertAttachment(file('sent')));
    dispatch(upsertAttachment(file('draft')));
    dispatch(upsertAttachment(file('sent', { spaceId: 'project-13' })));
    expect(ids()).toEqual(['draft']);
});

it('publishes an upload only after processing, preserves its preview, and handles native removal', async () => {
    const { dispatch } = mountComposer();
    dispatch(upsertAttachment(file('image', { processing: true })));
    expect(ids()).toEqual([]);
    attachmentDataCache.setImagePreview('image', new Uint8Array([1, 2, 3]));
    dispatch(upsertAttachment(file('image', { mimeType: 'image/png' })));
    expect(
        nativeStates().some((state) => state.attachedFiles.some((f) => f.id === 'image' && f.preview === 'AQID'))
    ).toBe(true);
    await act(async () => {
        await bridge().removeFileEvent('image');
    });
    expect(ids()).toEqual([]);
});

it('clears sent drafts and cannot repopulate them from a later project update', () => {
    const { dispatch } = mountComposer();
    dispatch(upsertAttachment(file('draft')));
    dispatch(clearProvisionalAttachments());
    dispatch(upsertAttachment(file('draft', { spaceId: 'project-13' })));
    expect(ids()).toEqual([]);
});

it('does not publish background attachments while no composer is mounted', () => {
    attachmentsReducer({}, upsertAttachment(file('project', { spaceId: 'project-13' })));
    expect(ids()).toEqual([]);
});

it('publishes the same draft-only snapshot to the Apple bridge', () => {
    const postMessage = jest.fn();
    (window as any).webkit = { messageHandlers: { nativeComposerStateHandler: { postMessage } } };
    try {
        const { dispatch, unmount } = mountComposer({ draft: file('draft') });
        dispatch(upsertAttachment(file('project', { spaceId: 'project-13' })));
        expect(
            postMessage.mock.calls.every(([state]) => state.attachedFiles.every((f: LumoFile) => f.id === 'draft'))
        ).toBe(true);
        expect(ids()).toEqual(['draft']);
        unmount();
        expect(postMessage.mock.lastCall[0].attachedFiles).toEqual([]);
    } finally {
        delete (window as any).webkit;
    }
});

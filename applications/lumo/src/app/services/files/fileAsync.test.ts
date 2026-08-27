import attachmentsReducer, { EMPTY_ATTACHMENT_MAP, deleteAttachment } from '../../redux/slices/core/attachments';
import type { AttachmentMap } from '../../redux/slices/core/attachments';
import type { LumoDispatch, LumoState } from '../../redux/store';
import type { FileProcessingResponse, FileProcessingService } from '../fileProcessingService';
import { handleFileAsync } from './fileAsync';

jest.mock('../../util/telemetry', () => ({
    ...jest.requireActual('../../util/telemetry'),
    sendFileUploadFinishEvent: jest.fn(),
}));

/**
 * An attachment is "provisional" (shown above the composer) exactly while it has no
 * `spaceId`. `handleFileAsync` dispatches the placeholder immediately, then awaits
 * `fileProcessingService.processFile(...)` before dispatching the processed result.
 * If the user deletes the attachment while that await is still pending, the late
 * dispatch must not resurrect it.
 */
describe('handleFileAsync vs. a concurrent deleteAttachment', () => {
    const flushMicrotasks = async (times = 5) => {
        for (let i = 0; i < times; i++) {
            await Promise.resolve();
        }
    };

    const makeFakeFile = (): File =>
        ({
            name: 'report.pdf',
            type: 'application/pdf',
            size: 1234,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        }) as unknown as File;

    // Dispatch feeds actions straight through the real `attachmentsReducer`, so the test
    // exercises the actual state transitions from attachments.ts rather than mocked ones.
    const makeMiniStore = () => {
        let state: AttachmentMap = EMPTY_ATTACHMENT_MAP;
        const dispatch = ((action: Parameters<typeof attachmentsReducer>[1]) => {
            state = attachmentsReducer(state, action);
            return action;
        }) as unknown as LumoDispatch;
        const getState = () => ({ attachments: state }) as unknown as LumoState;
        return { dispatch, getState, getAttachments: () => state };
    };

    const deferredProcessing = () => {
        let resolve!: (value: FileProcessingResponse) => void;
        const promise = new Promise<FileProcessingResponse>((r) => {
            resolve = r;
        });
        const fakeFileProcessingService = {
            processFile: jest.fn().mockReturnValue(promise),
        } as unknown as FileProcessingService;
        return { resolve, fakeFileProcessingService };
    };

    it('does not resurrect an attachment deleted while processing was still in flight', async () => {
        const { dispatch, getState, getAttachments } = makeMiniStore();
        const { resolve, fakeFileProcessingService } = deferredProcessing();

        const done = handleFileAsync(makeFakeFile(), [], fakeFileProcessingService)(dispatch, getState);

        await flushMicrotasks();

        const [placeholderId] = Object.keys(getAttachments());
        expect(placeholderId).toBeDefined();
        expect(getAttachments()[placeholderId].spaceId).toBeUndefined();

        // User removes the attachment from the composer while processing is still pending.
        dispatch(deleteAttachment(placeholderId));
        expect(getAttachments()[placeholderId]).toBeUndefined();

        // Processing now finishes, late, for an attachment the user already discarded.
        resolve({ id: placeholderId, type: 'text', content: 'hello world' });
        const outcome = await done;

        expect(getAttachments()[placeholderId]).toBeUndefined();

        // Callers (e.g. processFileLocally's search indexing / success toast) must be able to
        // tell this apart from a real success — otherwise they'd index or notify about content
        // the user just discarded.
        expect(outcome.success).toBe(false);
        expect(outcome.attachmentId).toBeUndefined();
        expect(outcome.markdown).toBeUndefined();
    });

    it('keeps the processed attachment when nothing is deleted while it processes', async () => {
        const { dispatch, getState, getAttachments } = makeMiniStore();
        const { resolve, fakeFileProcessingService } = deferredProcessing();

        const done = handleFileAsync(makeFakeFile(), [], fakeFileProcessingService)(dispatch, getState);

        await flushMicrotasks();

        const [placeholderId] = Object.keys(getAttachments());
        expect(getAttachments()[placeholderId].processing).toBe(true);

        resolve({ id: placeholderId, type: 'text', content: 'hello world' });
        const outcome = await done;

        const finalAttachment = getAttachments()[placeholderId];
        expect(finalAttachment).toBeDefined();
        expect(finalAttachment.processing).toBe(false);
        expect(finalAttachment.markdown).toBe('hello world');
        // Still provisional: not yet attached to a space, so it stays above the composer.
        expect(finalAttachment.spaceId).toBeUndefined();

        expect(outcome.success).toBe(true);
        expect(outcome.attachmentId).toBe(placeholderId);
        expect(outcome.markdown).toBe('hello world');
    });
});

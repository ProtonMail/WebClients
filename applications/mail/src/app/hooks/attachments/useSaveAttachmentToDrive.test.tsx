import { fireEvent, screen } from '@testing-library/react';

import { mockUseNotifications } from '@proton/app-context/testing/mockUseNotifications';
import type { ProtonDriveClient } from '@proton/drive/sdk';
import { ProtonDriveError } from '@proton/drive/sdk';
import type { MessageStateWithData } from '@proton/mail-message/store/messages/messagesTypes';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import { useMailDrive } from '../../drive/MailDriveProvider';
import type { PreparedDriveFile } from '../../helpers/attachment/prepareForDrive';
import type { DriveFile } from '../../helpers/attachment/saveToDrive';
import { SaveToDriveError, saveToDrive } from '../../helpers/attachment/saveToDrive';
import { mailTestRender } from '../../helpers/tests/render';
import { useDownload } from './useDownload';
import { useDriveRoomCheck } from './useDriveRoomCheck';
import { useSaveAttachmentToDrive } from './useSaveAttachmentToDrive';

vi.mock('../../drive/MailDriveProvider', () => ({ useMailDrive: vi.fn() }));
vi.mock('./useDownload', () => ({ useDownload: vi.fn() }));
vi.mock('./useDriveRoomCheck', () => ({ useDriveRoomCheck: vi.fn() }));
vi.mock('../../helpers/attachment/saveToDrive', async () => ({
    ...(await vi.importActual('../../helpers/attachment/saveToDrive')),
    saveToDrive: vi.fn(),
}));
vi.mock('@proton/shared/lib/helpers/sentry', async () => ({
    ...(await vi.importActual('@proton/shared/lib/helpers/sentry')),
    traceInitiativeError: vi.fn(),
}));

const genericErrorText = "Couldn't save the attachment to Proton Drive. Try again.";

const drive = { uid: 'drive' } as unknown as ProtonDriveClient;
const message = { localID: 'message' } as MessageStateWithData;
const attachment: Attachment = { ID: 'attachment', Name: 'invoice.pdf', MIMEType: 'application/pdf', Size: 3 };
const file: DriveFile = { data: new Uint8Array([1, 2, 3]), name: 'invoice.pdf', mediaType: 'application/pdf', size: 3 };

// Only the stage, reason and error class reach Sentry: never the message or the cause, which can hold user data
const expectReported = (stage: string, reason: string, errorName: string, leakedText: string) => {
    expect(traceInitiativeError).toHaveBeenCalledTimes(1);
    const [initiative, reported, context] = vi.mocked(traceInitiativeError).mock.calls[0];
    expect(initiative).toBe(SentryMailInitiatives.SAVE_TO_DRIVE);
    expect(reported).toBeInstanceOf(Error);
    expect((reported as Error).cause).toBeUndefined();
    expect((reported as Error).message).not.toContain(leakedText);
    expect(context).toEqual({ tags: { stage, reason }, extra: { errorName } });
    expect(JSON.stringify(context)).not.toContain(leakedText);
};

const createDeferred = <T,>() => {
    let resolve: (value: T) => void = () => {};
    const promise = new Promise<T>((_resolve) => {
        resolve = _resolve;
    });
    return { promise, resolve };
};

describe('useSaveAttachmentToDrive', () => {
    const createNotification = vi.fn();
    const checkDriveRoom = vi.fn();
    const showDriveFullError = vi.fn();
    const prepareForDrive = vi.fn();
    let onSaveToDrive: ((attachment: Attachment) => Promise<void>) | undefined;

    const Harness = () => {
        const result = useSaveAttachmentToDrive(message);
        onSaveToDrive = result.onSaveToDrive;
        return <>{result.confirmSaveModal}</>;
    };

    const setup = async ({
        isDriveAvailable = true,
        fits = true,
        prepared = { status: 'ready', file },
    }: { isDriveAvailable?: boolean; fits?: boolean; prepared?: PreparedDriveFile } = {}) => {
        vi.mocked(useMailDrive).mockReturnValue({ drive: isDriveAvailable ? drive : null, isDriveAvailable });
        vi.mocked(useDriveRoomCheck).mockReturnValue({ checkDriveRoom, showDriveFullError });
        vi.mocked(useDownload).mockReturnValue({ prepareForDrive } as unknown as ReturnType<typeof useDownload>);
        mockUseNotifications({ createNotification });
        checkDriveRoom.mockReturnValue(fits);
        prepareForDrive.mockResolvedValue(prepared);
        return mailTestRender(<Harness />);
    };

    beforeEach(() => {
        vi.clearAllMocks();
        onSaveToDrive = undefined;
    });

    it("gives no handler while Drive isn't available", async () => {
        await setup({ isDriveAvailable: false });

        expect(onSaveToDrive).toBeUndefined();
    });

    it('saves a ready attachment with the client and prepared file, and shows the name Drive gave it', async () => {
        vi.mocked(saveToDrive).mockResolvedValue({ nodeUid: 'volume~file', name: 'invoice (1).pdf' });
        await setup();

        await onSaveToDrive!(attachment);

        expect(checkDriveRoom).toHaveBeenCalledWith(attachment.Size);
        expect(prepareForDrive).toHaveBeenCalledWith(message, attachment);
        expect(saveToDrive).toHaveBeenCalledWith(drive, file);
        expect(createNotification).toHaveBeenCalledTimes(1);
        expect(createNotification).toHaveBeenCalledWith({
            text: '"invoice (1).pdf" saved to Proton Drive',
            type: 'success',
        });
    });

    it("doesn't prepare or upload when the attachment doesn't fit, and shows the storage error (not the generic one)", async () => {
        // The attachment can't be decrypted either: the room check comes first, so nothing is fetched.
        await setup({ fits: false, prepared: { status: 'cannotSave' } });

        await onSaveToDrive!(attachment);

        expect(prepareForDrive).not.toHaveBeenCalled();
        expect(saveToDrive).not.toHaveBeenCalled();
        expect(createNotification).not.toHaveBeenCalled();
    });

    it("doesn't upload an attachment that can't be decrypted, shows the generic error and reports nothing", async () => {
        await setup({ prepared: { status: 'cannotSave' } });

        await onSaveToDrive!(attachment);

        expect(saveToDrive).not.toHaveBeenCalled();
        expect(createNotification).toHaveBeenCalledWith({ text: genericErrorText, type: 'error' });
        expect(traceInitiativeError).not.toHaveBeenCalled();
    });

    it('saves an unverified attachment only after Save', async () => {
        vi.mocked(saveToDrive).mockResolvedValue({ nodeUid: 'volume~file', name: 'invoice.pdf' });
        await setup({ prepared: { status: 'senderNotVerified', file } });

        const saving = onSaveToDrive!(attachment);
        fireEvent.click(await screen.findByRole('button', { name: 'Save' }));
        await saving;

        expect(saveToDrive).toHaveBeenCalledWith(drive, file);
        expect(createNotification).toHaveBeenCalledWith({
            text: '"invoice.pdf" saved to Proton Drive',
            type: 'success',
        });
    });

    it('after Cancel, uploads nothing, shows nothing, reports nothing and settles', async () => {
        await setup({ prepared: { status: 'senderNotVerified', file } });

        const saving = onSaveToDrive!(attachment);
        fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

        await expect(saving).resolves.toBeUndefined();
        expect(saveToDrive).not.toHaveBeenCalled();
        expect(createNotification).not.toHaveBeenCalled();
        expect(traceInitiativeError).not.toHaveBeenCalled();
    });

    it("shows the storage error when Drive says it's full, and reports nothing", async () => {
        vi.mocked(saveToDrive).mockRejectedValue(new SaveToDriveError('storageFull', new Error('full')));
        await setup();

        await onSaveToDrive!(attachment);

        expect(showDriveFullError).toHaveBeenCalledTimes(1);
        expect(createNotification).not.toHaveBeenCalled();
        expect(traceInitiativeError).not.toHaveBeenCalled();
    });

    it("shows Drive's own explanation for other failures, and reports them", async () => {
        const error = new SaveToDriveError('other', new ProtonDriveError('invoice.pdf could not be saved'));
        vi.mocked(saveToDrive).mockRejectedValue(error);
        await setup();

        await onSaveToDrive!(attachment);

        expect(createNotification).toHaveBeenCalledWith({ text: 'invoice.pdf could not be saved', type: 'error' });
        expect(showDriveFullError).not.toHaveBeenCalled();
        expectReported('upload', 'other', 'ProtonDriveError', 'invoice.pdf');
    });

    it('shows the generic error and reports it when Drive gives no explanation', async () => {
        const error = new SaveToDriveError('other', new TypeError('Failed to fetch'));
        vi.mocked(saveToDrive).mockRejectedValue(error);
        await setup();

        await onSaveToDrive!(attachment);

        expect(createNotification).toHaveBeenCalledWith({ text: genericErrorText, type: 'error' });
        expectReported('upload', 'other', 'TypeError', 'Failed to fetch');
    });

    it('shows the generic error and reports it when preparing fails unexpectedly', async () => {
        const error = new Error('Unexpected invoice.pdf');
        await setup();
        prepareForDrive.mockRejectedValue(error);

        await onSaveToDrive!(attachment);

        expect(saveToDrive).not.toHaveBeenCalled();
        expect(createNotification).toHaveBeenCalledWith({ text: genericErrorText, type: 'error' });
        expectReported('save', 'unexpected', 'Error', 'invoice.pdf');
    });

    it.each([
        ['a server error', Object.assign(new Error('Server error'), { status: 500 })],
        ['no connection', Object.assign(new Error('Offline'), { name: 'OfflineError' })],
    ])(
        "adds no message and reports nothing when Mail's attachment request fails with %s, and settles",
        async (_, error) => {
            await setup();
            prepareForDrive.mockRejectedValue(error);

            await expect(onSaveToDrive!(attachment)).resolves.toBeUndefined();

            expect(saveToDrive).not.toHaveBeenCalled();
            expect(createNotification).not.toHaveBeenCalled();
            expect(traceInitiativeError).not.toHaveBeenCalled();
        }
    );

    it('still shows the saved message when the message is left mid-save', async () => {
        const save = createDeferred<{ nodeUid: string; name: string }>();
        vi.mocked(saveToDrive).mockReturnValue(save.promise);
        const { unmount } = await setup();

        const saving = onSaveToDrive!(attachment);
        await vi.waitFor(() => expect(saveToDrive).toHaveBeenCalled());
        unmount();
        save.resolve({ nodeUid: 'volume~file', name: 'invoice.pdf' });
        await saving;

        expect(createNotification).toHaveBeenCalledWith({
            text: '"invoice.pdf" saved to Proton Drive',
            type: 'success',
        });
    });
});

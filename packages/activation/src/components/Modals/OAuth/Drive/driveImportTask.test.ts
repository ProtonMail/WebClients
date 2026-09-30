import type { ProtonDriveClient } from '@protontech/drive-sdk';

import type { Api } from '@proton/shared/lib/interfaces';

import type { LaunchImportPayload } from '../../../../interface';
import { IMPORT_ERROR } from '../../../../interface';
import { startDriveImportTask } from './driveImportTask';

const BASE64_PASSPHRASE = new TextEncoder().encode('clear-passphrase').toBase64();

// The SDK prepares the crypto material for an orphaned import folder; we fake it.
const makeDriveClient = (folderOverrides: Record<string, unknown> = {}) =>
    ({
        getMyFilesRootFolder: jest.fn().mockResolvedValue({ uid: 'vol-1~node-1' }),
        getAvailableName: jest.fn().mockImplementation(async (_parent: unknown, name: string) => name),
        experimental: {
            prepareImportFolder: jest.fn().mockResolvedValue({
                encryptedName: 'enc-name',
                hash: 'folder-hash',
                armoredNodePassphrase: 'passphrase',
                armoredNodePassphraseSignature: 'passphrase-sig',
                armoredKey: 'node-key',
                armoredHashKey: 'hash-key',
                signatureEmail: 'sig@proton.me',
                base64Passphrase: BASE64_PASSPHRASE,
                armoredExtendedAttributes: 'xattr',
                ...folderOverrides,
            }),
        },
    }) as unknown as ProtonDriveClient;

const importPayload: LaunchImportPayload = { ImporterID: 'importer-1' };

const setup = ({
    drive = makeDriveClient(),
    api = jest.fn().mockResolvedValue({}),
    importedEmail = 'me@gmail.com',
}: { drive?: ProtonDriveClient; api?: jest.Mock; importedEmail?: string } = {}) => {
    const onPrepareFolderError = jest.fn();
    const run = () =>
        startDriveImportTask({
            api: api as unknown as Api,
            drive,
            importPayload,
            importedEmail,
            onPrepareFolderError,
        });

    return { run, api, drive, onPrepareFolderError };
};

const alreadyExistsError = { status: 422, data: { Code: IMPORT_ERROR.ALREADY_EXISTS, Error: 'Already exists' } };

describe('startDriveImportTask', () => {
    it('starts the import with the Drive ImportFolder payload built from the SDK', async () => {
        const { run, api, drive } = setup();

        await run();

        expect(drive.experimental.prepareImportFolder).toHaveBeenCalledWith('google-drive-me');
        expect(drive.getAvailableName).not.toHaveBeenCalled();
        expect(api).toHaveBeenCalledTimes(1);
        expect(api.mock.calls[0][0].data).toEqual({
            ImporterID: 'importer-1',
            Drive: {
                ImportFolder: {
                    VolumeID: 'vol-1',
                    ParentLinkID: 'node-1',
                    Name: 'enc-name',
                    Hash: 'folder-hash',
                    NodePassphrase: 'passphrase',
                    NodePassphraseSignature: 'passphrase-sig',
                    NodeKey: 'node-key',
                    NodeHashKey: 'hash-key',
                    SignatureAddress: 'sig@proton.me',
                    NodePassphraseClearText: BASE64_PASSPHRASE,
                    XAttr: 'xattr',
                },
            },
        });
    });

    it('omits XAttr when the SDK returns no extended attributes', async () => {
        const { run, api } = setup({ drive: makeDriveClient({ armoredExtendedAttributes: undefined }) });

        await run();

        expect(api.mock.calls[0][0].data.Drive.ImportFolder).not.toHaveProperty('XAttr');
    });

    it('replaces characters that are invalid in folder names with dashes', async () => {
        const { run, drive } = setup({ importedEmail: 'a:b/c*d@gmail.com' });

        await run();

        expect(drive.experimental.prepareImportFolder).toHaveBeenCalledWith('google-drive-a-b-c-d');
    });

    it('retries with the next available folder name when the import folder name is taken', async () => {
        const drive = makeDriveClient();
        (drive.getAvailableName as jest.Mock).mockResolvedValue('google-drive-me (1)');
        const { run, api } = setup({
            drive,
            api: jest.fn().mockRejectedValueOnce(alreadyExistsError).mockResolvedValue({}),
        });

        await run();

        expect(api).toHaveBeenCalledTimes(2);
        // The expected conflict must not surface to the user.
        expect(api.mock.calls[0][0].silence).toEqual([IMPORT_ERROR.ALREADY_EXISTS]);
        expect(drive.getAvailableName).toHaveBeenCalledWith({ uid: 'vol-1~node-1' }, 'google-drive-me');
        expect(drive.experimental.prepareImportFolder).toHaveBeenLastCalledWith('google-drive-me (1)');
    });

    it('does not retry on errors other than already-exists', async () => {
        const error = { status: 500, data: { Code: 2000, Error: 'Server error' } };
        const { run, api, drive } = setup({ api: jest.fn().mockRejectedValue(error) });

        await expect(run()).rejects.toBe(error);

        expect(api).toHaveBeenCalledTimes(1);
        expect(drive.getAvailableName).not.toHaveBeenCalled();
    });

    it('reports folder preparation errors and does not start the import', async () => {
        const error = new Error('sdk failed');
        const drive = makeDriveClient();
        (drive.getMyFilesRootFolder as jest.Mock).mockRejectedValue(error);
        const { run, api, onPrepareFolderError } = setup({ drive });

        await expect(run()).rejects.toBe(error);

        expect(onPrepareFolderError).toHaveBeenCalledWith(error);
        expect(api).not.toHaveBeenCalled();
    });
});

import type { ProtonDriveClient } from '@protontech/drive-sdk';

import type { LaunchImportPayload } from '@proton/activation/src/interface';
import { ImportType } from '@proton/activation/src/interface';
import { changeOAuthStep, resetOauthDraft } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.actions';
import type { ImporterData } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.interface';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { Address, Api } from '@proton/shared/lib/interfaces';
import type { Calendar } from '@proton/shared/lib/interfaces/calendar';
import type { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys';

import { createImporterTask } from './useStepLoadingImporting.helpers';

// We only need splitNodeUid - node UIDs are `${volumeId}~${nodeId}`.
jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    ...jest.requireActual('@proton/shared/lib/helpers/sentry'),
    captureMessage: jest.fn(),
}));

// The SDK prepares the crypto material for an orphaned import folder; we fake it.
const makeDriveClient = (folderOverrides: Record<string, unknown> = {}) =>
    ({
        getMyFilesRootFolder: jest.fn().mockResolvedValue({ uid: 'vol-1~node-1' }),
        experimental: {
            prepareImportFolder: jest.fn().mockResolvedValue({
                encryptedName: 'enc-name',
                hash: 'folder-hash',
                armoredNodePassphrase: 'passphrase',
                armoredNodePassphraseSignature: 'passphrase-sig',
                armoredKey: 'node-key',
                armoredHashKey: 'hash-key',
                signatureEmail: 'sig@proton.me',
                passphrase: 'clear-passphrase',
                armoredExtendedAttributes: 'xattr',
                ...folderOverrides,
            }),
        },
    }) as unknown as ProtonDriveClient;

interface Overrides {
    products?: ImportType[];
    importerData?: ImporterData;
    driveClient?: ProtonDriveClient;
    availableAddresses?: Address[];
    api?: jest.Mock;
}

const setup = (overrides: Overrides = {}) => {
    const api = overrides.api ?? jest.fn().mockResolvedValue({});
    const dispatch = jest.fn();
    const call = jest.fn().mockResolvedValue(undefined);
    const errorHandler = jest.fn();
    const setIsCreatingCalendar = jest.fn();
    const setIsCreatingImportTask = jest.fn();
    const setCalendarsToBeCreated = jest.fn();
    const increaseCalendarCount = jest.fn();

    const props = {
        isLabelMapping: false,
        products: overrides.products ?? [ImportType.CONTACTS],
        importerData: overrides.importerData ?? { importerId: 'importer-1', importedEmail: 'me@gmail.com' },
        api: api as unknown as Api,
        driveClient: overrides.driveClient,
        getAddressKeys: jest.fn() as unknown as GetAddressKeys,
        dispatch,
        availableAddresses: overrides.availableAddresses ?? [{ ID: 'addr-1' } as Address],
        calendars: [] as Calendar[],
        call,
        errorHandler,
        setIsCreatingCalendar,
        setIsCreatingImportTask,
        setCalendarsToBeCreated,
        increaseCalendarCount,
    };

    return { props, api, dispatch, call, errorHandler, setIsCreatingImportTask };
};

// The only api call in the non-calendar paths is the start-import request.
const getStartPayload = (api: jest.Mock): LaunchImportPayload | undefined => {
    const startCall = api.mock.calls.find(
        ([req]) => typeof req?.url === 'string' && req.url.includes('importers/start')
    );
    return startCall?.[0]?.data;
};

afterEach(() => {
    jest.clearAllMocks();
});

describe('createImporterTask', () => {
    it('submits a contacts-only payload and advances to the success step', async () => {
        const { props, api, dispatch, call, setIsCreatingImportTask } = setup({ products: [ImportType.CONTACTS] });

        await createImporterTask(props);

        expect(getStartPayload(api)).toEqual({ ImporterID: 'importer-1', Contacts: {} });
        expect(call).toHaveBeenCalled();
        expect(dispatch).toHaveBeenCalledWith(changeOAuthStep('success'));
        expect(setIsCreatingImportTask).toHaveBeenCalledWith(true);
        expect(setIsCreatingImportTask).toHaveBeenLastCalledWith(false);
    });

    it('builds the Drive ImportFolder payload from the SDK when Drive is selected', async () => {
        const { props, api } = setup({ products: [ImportType.DRIVE], driveClient: makeDriveClient() });

        await createImporterTask(props);

        expect(getStartPayload(api)?.Drive).toEqual({
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
                NodePassphraseClearText: 'clear-passphrase',
                XAttr: 'xattr',
            },
        });
    });

    it('omits XAttr when the SDK returns no extended attributes', async () => {
        const driveClient = makeDriveClient({ armoredExtendedAttributes: undefined });
        const { props, api } = setup({ products: [ImportType.DRIVE], driveClient });

        await createImporterTask(props);

        expect(getStartPayload(api)?.Drive?.ImportFolder).not.toHaveProperty('XAttr');
    });

    it('skips the Drive payload when no Drive client is available', async () => {
        const { props, api, dispatch } = setup({ products: [ImportType.DRIVE], driveClient: undefined });

        await createImporterTask(props);

        expect(getStartPayload(api)?.Drive).toBeUndefined();
        expect(dispatch).toHaveBeenCalledWith(changeOAuthStep('success'));
    });

    it('runs the error handler and resets the draft when the import task fails', async () => {
        const error = new Error('boom');
        const { props, dispatch, errorHandler } = setup({
            products: [ImportType.CONTACTS],
            api: jest.fn().mockRejectedValue(error),
        });

        await createImporterTask(props);

        expect(errorHandler).toHaveBeenCalledWith(error);
        expect(dispatch).toHaveBeenCalledWith(resetOauthDraft());
        expect(dispatch).not.toHaveBeenCalledWith(changeOAuthStep('success'));
    });

    it('rolls back to the prepare step when calendar creation has no valid address', async () => {
        const importerData: ImporterData = {
            importerId: 'importer-1',
            importedEmail: 'me@gmail.com',
            calendars: {
                calendars: [{ source: 'Work', description: '', id: 'c1', checked: true }],
                initialFields: [{ source: 'Work', description: '', id: 'c1', checked: true }],
            },
        };
        const { props, api, dispatch } = setup({
            products: [ImportType.CALENDAR],
            importerData,
            availableAddresses: [],
        });

        await createImporterTask(props);

        expect(dispatch).toHaveBeenCalledWith(changeOAuthStep('prepare-import'));
        expect(captureMessage).toHaveBeenCalled();
        // The import task must not start after a calendar rollback.
        expect(getStartPayload(api)).toBeUndefined();
        expect(dispatch).not.toHaveBeenCalledWith(changeOAuthStep('success'));
    });
});

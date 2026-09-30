import type { ProtonDriveClient } from '@protontech/drive-sdk';

import { captureMessage, traceError } from '@proton/shared/lib/helpers/sentry';
import type { Address, Api } from '@proton/shared/lib/interfaces';
import type { Calendar } from '@proton/shared/lib/interfaces/calendar';
import type { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys';

import type { LaunchImportPayload } from '../../../../interface';
import { IMPORT_ERROR, ImportType } from '../../../../interface';
import { changeOAuthStep, resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import type { ImporterData } from '../../../../logic/draft/oauthDraft/oauthDraft.interface';
import { createImporterTask } from './useStepLoadingImporting.helpers';

// We only need splitNodeUid - node UIDs are `${volumeId}~${nodeId}`.
jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    ...jest.requireActual('@proton/shared/lib/helpers/sentry'),
    captureMessage: jest.fn(),
    traceError: jest.fn(),
}));

// The ImportFolder payload itself is covered in driveImportTask.test.ts.
const makeDriveClient = () =>
    ({
        getMyFilesRootFolder: jest.fn().mockResolvedValue({ uid: 'vol-1~node-1' }),
        experimental: {
            prepareImportFolder: jest.fn().mockResolvedValue({ encryptedName: 'enc-name' }),
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

const getStartCalls = (api: jest.Mock) =>
    api.mock.calls
        .map(([req]) => req)
        .filter((req) => typeof req?.url === 'string' && req.url.includes('importers/start'));

// The only api call in the non-calendar paths is the start-import request.
const getStartPayload = (api: jest.Mock): LaunchImportPayload | undefined => getStartCalls(api)[0]?.data;

const alreadyExistsError = { status: 422, data: { Code: IMPORT_ERROR.ALREADY_EXISTS, Error: 'Already exists' } };

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

    it('starts the Drive import task when Drive is selected and advances to the success step', async () => {
        const { props, api, dispatch } = setup({ products: [ImportType.DRIVE], driveClient: makeDriveClient() });

        await createImporterTask(props);

        expect(getStartCalls(api)).toHaveLength(1);
        expect(getStartPayload(api)?.Drive?.ImportFolder).toBeDefined();
        expect(dispatch).toHaveBeenCalledWith(changeOAuthStep('success'));
    });

    it('does not retry on an already-exists error when Drive is not imported', async () => {
        const api = jest.fn().mockRejectedValue(alreadyExistsError);
        const { props, errorHandler } = setup({ products: [ImportType.CONTACTS], api });

        await createImporterTask(props);

        expect(getStartCalls(api)).toHaveLength(1);
        expect(errorHandler).toHaveBeenCalledWith(alreadyExistsError, { trace: true });
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

        expect(errorHandler).toHaveBeenCalledWith(error, { trace: true });
        expect(dispatch).toHaveBeenCalledWith(resetOauthDraft());
        expect(dispatch).not.toHaveBeenCalledWith(changeOAuthStep('success'));
    });

    it('reports Drive folder errors to Sentry once, with context', async () => {
        const error = new Error('sdk failed');
        const driveClient = makeDriveClient();
        (driveClient.getMyFilesRootFolder as jest.Mock).mockRejectedValue(error);
        const { props, api, dispatch, errorHandler } = setup({ products: [ImportType.DRIVE], driveClient });

        await createImporterTask(props);

        expect(traceError).toHaveBeenCalledTimes(1);
        expect(traceError).toHaveBeenCalledWith(error, expect.objectContaining({ tags: { component: 'drive-sdk' } }));
        expect(errorHandler).toHaveBeenCalledWith(error, { trace: false });
        expect(getStartPayload(api)).toBeUndefined();
        expect(dispatch).toHaveBeenCalledWith(resetOauthDraft());
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

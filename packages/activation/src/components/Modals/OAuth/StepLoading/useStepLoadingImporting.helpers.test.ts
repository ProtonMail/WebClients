import type { ProtonDriveClient } from '@protontech/drive-sdk';
import { type Mock, vi } from 'vitest';

import { captureMessage, traceError } from '@proton/shared/lib/helpers/sentry';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { Calendar } from '@proton/shared/lib/interfaces/calendar/Calendar';
import type { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys';

import type { LaunchImportPayload } from '../../../../interface';
import { IMPORT_ERROR, ImportProvider, ImportType, TIME_PERIOD } from '../../../../interface';
import { changeOAuthStep, resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import type { ImporterData } from '../../../../logic/draft/oauthDraft/oauthDraft.interface';
import { mockAccountImportFlowTracker } from '../../../../telemetry/mockTrackerOfGroup';
import { createImporterTask } from './useStepLoadingImporting.helpers';

// We only need splitNodeUid - node UIDs are `${volumeId}~${nodeId}`.
vi.mock('@proton/shared/lib/helpers/sentry', async () => ({
    ...(await vi.importActual('@proton/shared/lib/helpers/sentry')),
    captureMessage: vi.fn(),
    traceError: vi.fn(),
}));

// The ImportFolder payload itself is covered in driveImportTask.test.ts.
const makeDriveClient = () =>
    ({
        getMyFilesRootFolder: vi.fn().mockResolvedValue({ uid: 'vol-1~node-1' }),
        experimental: {
            prepareImportFolder: vi.fn().mockResolvedValue({ encryptedName: 'enc-name' }),
        },
    }) as unknown as ProtonDriveClient;

interface Overrides {
    products?: ImportType[];
    importerData?: ImporterData;
    driveClient?: ProtonDriveClient;
    availableAddresses?: Address[];
    api?: Mock;
}

const setup = (overrides: Overrides = {}) => {
    const api = overrides.api ?? vi.fn().mockResolvedValue({});
    const dispatch = vi.fn();
    const call = vi.fn().mockResolvedValue(undefined);
    const errorHandler = vi.fn();
    const setIsCreatingCalendar = vi.fn();
    const setIsCreatingImportTask = vi.fn();
    const setCalendarsToBeCreated = vi.fn();
    const increaseCalendarCount = vi.fn();

    const props = {
        provider: ImportProvider.OUTLOOK,
        isLabelMapping: false,
        products: overrides.products ?? [ImportType.CONTACTS],
        importerData: overrides.importerData ?? { importerId: 'importer-1', importedEmail: 'me@gmail.com' },
        api: api as unknown as Api,
        driveClient: overrides.driveClient,
        getAddressKeys: vi.fn() as unknown as GetAddressKeys,
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

const getStartCalls = (api: Mock) =>
    api.mock.calls
        .map(([req]) => req)
        .filter((req) => typeof req?.url === 'string' && req.url.includes('importers/start'));

// The only api call in the non-calendar paths is the start-import request.
const getStartPayload = (api: Mock): LaunchImportPayload | undefined => getStartCalls(api)[0]?.data;

const alreadyExistsError = { status: 422, data: { Code: IMPORT_ERROR.ALREADY_EXISTS, Error: 'Already exists' } };

afterEach(() => {
    vi.clearAllMocks();
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
        const api = vi.fn().mockRejectedValue(alreadyExistsError);
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
            api: vi.fn().mockRejectedValue(error),
        });

        await createImporterTask(props);

        expect(errorHandler).toHaveBeenCalledWith(error, { trace: true });
        expect(dispatch).toHaveBeenCalledWith(resetOauthDraft());
        expect(dispatch).not.toHaveBeenCalledWith(changeOAuthStep('success'));
    });

    it('reports Drive folder errors to Sentry once, with context', async () => {
        const error = new Error('sdk failed');
        const driveClient = makeDriveClient();
        (driveClient.getMyFilesRootFolder as Mock).mockRejectedValue(error);
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

    describe('telemetry', () => {
        it('sends flow_finished with the products and the period once the import started', async () => {
            const { reports } = mockAccountImportFlowTracker();
            const { props } = setup({
                products: [ImportType.MAIL, ImportType.CONTACTS],
                importerData: {
                    importerId: 'importer-1',
                    importedEmail: 'me@outlook.com',
                    emails: {
                        fields: {
                            mapping: [],
                            importLabel: { Name: 'Outlook', Color: '#fff', Type: 1 },
                            importAddress: { ID: 'addr-1' },
                            importPeriod: TIME_PERIOD.LAST_3_MONTHS,
                        },
                        initialFields: { importPeriod: TIME_PERIOD.BIG_BANG },
                    },
                } as unknown as ImporterData,
            });

            await createImporterTask(props);

            expect(reports).toHaveLength(1);
            expect(reports[0]).toMatchObject({
                measurementGroup: 'any.web.account_import_flow',
                event: 'flow_finished',
                dimensions: {
                    provider: 'outlook',
                    importsMail: 'true',
                    importsContacts: 'true',
                    importPeriodSelected: 'last_3_months',
                },
            });
            expect(reports[0].values).toHaveProperty('timestampMs');
        });

        it('sends creation_error when the import task fails to start', async () => {
            const { reports } = mockAccountImportFlowTracker();
            const { props } = setup({
                products: [ImportType.CONTACTS],
                api: vi.fn().mockRejectedValue(alreadyExistsError),
            });

            await createImporterTask(props);

            expect(reports).toHaveLength(1);
            expect(reports[0]).toMatchObject({
                event: 'flow_error',
                dimensions: { provider: 'outlook', importsContacts: 'true', errorStep: 'import_start' },
            });
        });

        it('sends creation_error when the calendars cannot be created', async () => {
            const { reports } = mockAccountImportFlowTracker();
            const { props } = setup({
                products: [ImportType.CALENDAR],
                importerData: {
                    importerId: 'importer-1',
                    importedEmail: 'me@gmail.com',
                    calendars: {
                        calendars: [{ source: 'Work', description: '', id: 'c1', checked: true }],
                        initialFields: [{ source: 'Work', description: '', id: 'c1', checked: true }],
                    },
                },
                availableAddresses: [],
            });

            await createImporterTask(props);

            expect(reports).toHaveLength(1);
            expect(reports[0]).toMatchObject({
                event: 'flow_error',
                dimensions: { importsCalendar: 'true', errorStep: 'calendar_creation' },
            });
        });

        it('sends creation_error when the import payload cannot be built', async () => {
            const { reports } = mockAccountImportFlowTracker();
            // Mail without any email fields: building the payload throws
            const { props } = setup({ products: [ImportType.MAIL] });

            await expect(createImporterTask(props)).rejects.toThrow();

            expect(reports).toHaveLength(1);
            expect(reports[0]).toMatchObject({
                event: 'flow_error',
                dimensions: { importsMail: 'true', errorStep: 'import_payload' },
            });
        });

        it('sends importer_created only, when the import started but refreshing the events fails', async () => {
            const { reports } = mockAccountImportFlowTracker();
            const { props, call } = setup({ products: [ImportType.CONTACTS] });
            call.mockRejectedValueOnce(new Error('event loop'));

            await createImporterTask(props);

            expect(reports.map((report) => report.event)).toEqual(['flow_finished']);
        });

        it('does not track drive-only imports', async () => {
            const { reports } = mockAccountImportFlowTracker();
            const { props } = setup({ products: [ImportType.DRIVE], driveClient: makeDriveClient() });

            await createImporterTask(props);

            expect(reports).toHaveLength(0);
        });
    });
});

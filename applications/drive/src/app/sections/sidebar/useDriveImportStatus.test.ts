import { act, renderHook } from '@testing-library/react';

import type { ApiEvent } from '@proton/activation/src/api/api.interface';
import { ApiImporterState } from '@proton/activation/src/api/api.interface';
import { ImportType } from '@proton/activation/src/interface';
import type { EasySwitchState } from '@proton/activation/src/logic/store';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { useEventManager } from '@proton/components';

import { useDriveImportStatus } from './useDriveImportStatus';

jest.mock('@proton/components', () => ({
    useEventManager: jest.fn(),
}));

jest.mock('@proton/activation/src/logic/store', () => ({
    useEasySwitchDispatch: jest.fn(),
    useEasySwitchSelector: jest.fn(),
}));

/** loadImporters() is an abortable thunk, the hook aborts it on unmount. */
const dispatch = jest.fn(() => ({ abort: jest.fn() }));
/** Set by the fake event manager so tests can push an event into the hook. */
let emitEvent: (apiEvent: ApiEvent) => void;

const DRIVE_IMPORTER = { ID: 'importer-id', account: 'user@gmail.com', products: [ImportType.DRIVE] };

/** Real selectors run against this, so the tests cover them too. */
const easySwitchState = ({
    importer,
    activeState,
    loading = 'success',
}: {
    importer?: boolean;
    activeState?: ApiImporterState;
    loading?: 'idle' | 'pending' | 'success' | 'failed';
}) =>
    ({
        importers: {
            importers: importer ? { [DRIVE_IMPORTER.ID]: DRIVE_IMPORTER } : {},
            activeImporters:
                activeState === undefined
                    ? {}
                    : {
                          'importer-id-Drive': {
                              localID: 'importer-id-Drive',
                              importerID: DRIVE_IMPORTER.ID,
                              product: ImportType.DRIVE,
                              importState: activeState,
                          },
                      },
            loading,
        },
    }) as unknown as EasySwitchState;

const renderWithState = (state: EasySwitchState) => {
    jest.mocked(useEasySwitchSelector).mockImplementation((selector) => selector(state));
    return renderHook(() => useDriveImportStatus());
};

const importerEvent = (state: ApiImporterState): ApiEvent => ({
    Imports: [{ ID: 'importer-id', Action: 2, Importer: { Active: { Drive: { State: state } } } } as any],
});

const reportEvent = (state: ApiImporterState): ApiEvent => ({
    ImportReports: [{ ID: 'report-id', Action: 2, ImportReport: { Summary: { Drive: { State: state } } } } as any],
});

describe('useDriveImportStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(useEasySwitchDispatch).mockReturnValue(dispatch as any);
        jest.mocked(useEventManager).mockReturnValue({
            subscribe: (listener: (apiEvent: ApiEvent) => void) => {
                emitEvent = listener;
                return jest.fn();
            },
        } as any);
    });

    describe('visibility', () => {
        it('reports no completed import for a user who never imported', () => {
            const { result } = renderWithState(easySwitchState({}));

            expect(result.current.isLoaded).toBe(true);
            expect(result.current.hasCompletedImport).toBe(false);
            expect(result.current.isImporting).toBe(false);
        });

        it('reports a completed import once an import has finished', () => {
            const { result } = renderWithState(easySwitchState({ importer: true }));

            expect(result.current.hasCompletedImport).toBe(true);
        });

        it('reports no completed import while an import is running', () => {
            const { result } = renderWithState(
                easySwitchState({ importer: true, activeState: ApiImporterState.RUNNING })
            );

            expect(result.current.hasCompletedImport).toBe(false);
            expect(result.current.isImporting).toBe(true);
        });

        it('is not loaded until the importers have been fetched once', () => {
            const { result } = renderWithState(easySwitchState({ loading: 'pending' }));

            expect(result.current.isLoaded).toBe(false);
        });
    });

    describe('outcome', () => {
        it('has no outcome until an event arrives', () => {
            const { result } = renderWithState(easySwitchState({ importer: true }));

            expect(result.current.outcome).toBeUndefined();
        });

        it('reports success when an importer event reports a finished import', () => {
            const { result } = renderWithState(easySwitchState({ importer: true }));

            act(() => emitEvent(importerEvent(ApiImporterState.DONE)));

            expect(result.current.outcome).toBe('success');
        });

        it('reports success when the completion only arrives as a report', () => {
            const { result } = renderWithState(easySwitchState({ importer: true }));

            act(() => emitEvent(reportEvent(ApiImporterState.DONE)));

            expect(result.current.outcome).toBe('success');
        });

        it('clears the outcome', () => {
            const { result } = renderWithState(easySwitchState({ importer: true }));

            act(() => emitEvent(importerEvent(ApiImporterState.DONE)));
            expect(result.current.outcome).toBe('success');

            act(() => result.current.clearOutcome());
            expect(result.current.outcome).toBeUndefined();
        });

        it('reports failure when the import failed', () => {
            const { result } = renderWithState(easySwitchState({ importer: true }));

            act(() => emitEvent(importerEvent(ApiImporterState.FAILED)));

            expect(result.current.outcome).toBe('failed');
        });

        it('ignores an import that is still running', () => {
            const { result } = renderWithState(
                easySwitchState({ importer: true, activeState: ApiImporterState.RUNNING })
            );

            act(() => emitEvent(importerEvent(ApiImporterState.RUNNING)));

            expect(result.current.outcome).toBeUndefined();
        });

        it('does not refetch the importers when the outcome comes from an importer event', () => {
            renderWithState(easySwitchState({ importer: true }));
            expect(dispatch).toHaveBeenCalledTimes(1);

            act(() => emitEvent(importerEvent(ApiImporterState.DONE)));

            // The importers slice already applies importer events, so no extra request.
            expect(dispatch).toHaveBeenCalledTimes(1);
        });

        it('refetches the importers when the outcome only comes from a report', () => {
            renderWithState(easySwitchState({ importer: true }));
            expect(dispatch).toHaveBeenCalledTimes(1);

            act(() => emitEvent(reportEvent(ApiImporterState.DONE)));

            expect(dispatch).toHaveBeenCalledTimes(2);
        });

        it('ignores events without Drive data', () => {
            const { result } = renderWithState(easySwitchState({ importer: true }));

            act(() => emitEvent({ Imports: [{ ID: 'importer-id', Action: 2, Importer: { Active: {} } } as any] }));

            expect(result.current.outcome).toBeUndefined();
        });
    });
});

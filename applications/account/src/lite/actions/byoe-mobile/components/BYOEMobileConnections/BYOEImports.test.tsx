import { render, screen } from '@testing-library/react';

import { ApiImportProvider, ApiImporterState, ApiReportRollbackState } from '@proton/activation/src/api/api.interface';

import { BYOEImports } from './BYOEImports';

let mockActiveImporterEntries: any[] = [];
let mockReportEntries: any[] = [];

jest.mock('./ImporterActions', () => ({ ImporterActions: () => null }));
jest.mock('./ReportActions', () => ({ ReportActions: () => null }));
jest.mock('@proton/activation/src/logic/store', () => ({
    useEasySwitchSelector: (selector: () => unknown) => selector(),
}));
jest.mock('@proton/activation/src/logic/importers/importers.selectors', () => ({
    selectActiveImporterEntriesByDate: () => mockActiveImporterEntries,
}));
jest.mock('@proton/activation/src/logic/reports/reports.selectors', () => ({
    selectReportEntriesByDate: () => mockReportEntries,
}));
jest.mock('@proton/activation/src/components/ReportsTable/formatReportDate', () => ({
    formatReportDate: (timestamp?: number) => (timestamp ? 'Jan 1, 2025' : null),
}));
jest.mock('@proton/shared/lib/helpers/humanSize', () => ({
    __esModule: true,
    default: () => '1 MB',
}));

const buildActiveImporterEntry = (importState: ApiImporterState) => ({
    activeImporter: { importerID: 'importer-id', localID: 'local-id', importState },
    importer: { account: 'jane@gmail.com', provider: ApiImportProvider.GOOGLE },
});

const buildReportEntry = ({
    state = ApiImporterState.DONE,
    rollbackState,
    endDate = 1700000000,
}: {
    state?: ApiImporterState;
    rollbackState?: ApiReportRollbackState;
    endDate?: number;
} = {}) => ({
    summary: { localID: 'report-id-1', state, rollbackState },
    report: { account: 'jane@gmail.com', provider: ApiImportProvider.GOOGLE, size: 1024, endDate },
});

describe('BYOEImports', () => {
    beforeEach(() => {
        mockActiveImporterEntries = [];
        mockReportEntries = [];
    });

    it('Should render nothing without imports', () => {
        const { container } = render(<BYOEImports />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('active importers', () => {
        it('Should display the importer status', () => {
            mockActiveImporterEntries = [buildActiveImporterEntry(ApiImporterState.RUNNING)];
            render(<BYOEImports />);

            screen.getByText('jane@gmail.com');
            screen.getByText('In progress...');
        });

        it.each([ApiImporterState.DONE, ApiImporterState.FAILED])(
            'Should keep the row without a status for a finished importer (state %s)',
            (state) => {
                mockActiveImporterEntries = [buildActiveImporterEntry(state)];
                render(<BYOEImports />);

                screen.getByText('jane@gmail.com');
                expect(screen.queryByText('In progress...')).toBeNull();
            }
        );
    });

    describe('reports', () => {
        it('Should compose the second line from the status, the date and the size', () => {
            mockReportEntries = [buildReportEntry()];
            render(<BYOEImports />);

            screen.getByText('Imported · Jan 1, 2025 · 1 MB');
        });

        it('Should skip the date when there is none', () => {
            mockReportEntries = [buildReportEntry({ endDate: 0 })];
            render(<BYOEImports />);

            screen.getByText('Imported · 1 MB');
        });

        it('Should skip the status when there is none to display', () => {
            mockReportEntries = [buildReportEntry({ state: ApiImporterState.RUNNING })];
            render(<BYOEImports />);

            screen.getByText('Jan 1, 2025 · 1 MB');
        });

        it('Should display the rollback state over the report state', () => {
            mockReportEntries = [buildReportEntry({ rollbackState: ApiReportRollbackState.ROLLED_BACK })];
            render(<BYOEImports />);

            screen.getByText('Undo finished · Jan 1, 2025 · 1 MB');
        });
    });
});

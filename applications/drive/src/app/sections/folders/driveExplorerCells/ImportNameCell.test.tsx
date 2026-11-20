import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ApiImportProvider, ApiImporterError } from '@proton/activation/src/api/api.interface';
import { ImportType } from '@proton/activation/src/interface';
import { renderWithProviders } from '@proton/components/testing/vitest/renderWithProviders';

import { ImportNameCell } from './ImportNameCell';

const importer = {
    ID: 'importer-id',
    account: 'user@example.com',
    products: [ImportType.DRIVE],
    provider: ApiImportProvider.GOOGLE,
};

describe('ImportNameCell', () => {
    it('shows a loader and the imported size while the import runs', async () => {
        renderWithProviders(
            <ImportNameCell
                importingFolder={{
                    uid: 'uid',
                    name: 'google-drive-user',
                    startTime: new Date(2026, 0, 15),
                    importedBytes: 2048,
                }}
            />
        );

        expect(screen.getByText('google-drive-user')).toBeInTheDocument();
        await userEvent.hover(screen.getByTestId('circle-loader'));

        expect(
            await screen.findByText(/Importing from Google Drive…\s*2\.00 KB imported/, undefined, { timeout: 3000 })
        ).toBeInTheDocument();
    });

    it('only says the import is running before anything is imported', async () => {
        renderWithProviders(
            <ImportNameCell
                importingFolder={{
                    uid: 'uid',
                    name: 'google-drive-user',
                    startTime: new Date(2026, 0, 15),
                    importedBytes: 0,
                }}
            />
        );

        await userEvent.hover(screen.getByTestId('circle-loader'));

        expect(
            await screen.findByText('Importing from Google Drive…', undefined, { timeout: 3000 })
        ).toBeInTheDocument();
        expect(screen.queryByText(/imported$/)).toBeNull();
    });

    it.each([
        { errorCode: ApiImporterError.ERROR_CODE_QUOTA_LIMIT, tooltip: /Import paused\s*More storage needed/ },
        {
            errorCode: ApiImporterError.ERROR_CODE_IMAP_CONNECTION,
            tooltip: /Import interrupted\s*Reconnect Google Drive/,
        },
    ])('shows an error icon and why the import paused ($tooltip)', async ({ errorCode, tooltip }) => {
        renderWithProviders(
            <ImportNameCell
                importingFolder={{
                    uid: 'uid',
                    name: 'google-drive-user',
                    startTime: new Date(2026, 0, 15),
                    importedBytes: 0,
                    pausedImport: { importer, errorCode },
                }}
            />
        );

        await userEvent.hover(screen.getByTestId('import-error-icon'));

        expect(await screen.findByText(tooltip, undefined, { timeout: 3000 })).toBeInTheDocument();
    });
});

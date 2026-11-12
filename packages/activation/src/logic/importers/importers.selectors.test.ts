import { ApiImporterError, ApiImporterState } from '../../api/api.interface';
import { ImportType } from '../../interface';
import type { EasySwitchState } from '../store';
import { selectActiveImportersErrors } from './importers.selectors';

const pausedImportState = (product: ImportType, errorCode: ApiImporterError) =>
    ({
        importers: {
            importers: { 'importer-id': { ID: 'importer-id', account: 'user@gmail.com', products: [product] } },
            activeImporters: {
                [`importer-id-${product}`]: {
                    localID: `importer-id-${product}`,
                    importerID: 'importer-id',
                    product,
                    importState: ApiImporterState.PAUSED,
                    errorCode,
                },
            },
            loading: 'success',
        },
    }) as unknown as EasySwitchState;

describe('selectActiveImportersErrors', () => {
    it('shows a banner for a paused Mail import', () => {
        const { importErrors } = selectActiveImportersErrors(
            pausedImportState(ImportType.MAIL, ApiImporterError.ERROR_CODE_IMAP_CONNECTION)
        );

        expect(importErrors).toEqual(['authConnection']);
    });

    it.each([ApiImporterError.ERROR_CODE_IMAP_CONNECTION, ApiImporterError.ERROR_CODE_QUOTA_LIMIT])(
        'shows no banner for a paused Drive import (error code %s)',
        (errorCode) => {
            const { importErrors } = selectActiveImportersErrors(pausedImportState(ImportType.DRIVE, errorCode));

            expect(importErrors).toEqual([]);
        }
    );
});

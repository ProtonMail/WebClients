import { ImportProvider, ImportType } from '../../interface';
import { getProviderLogo } from './ReportsTableIcon';

describe('getProviderLogo', () => {
    it('returns a logo for a Google Drive import', () => {
        expect(getProviderLogo(ImportProvider.GOOGLE, ImportType.DRIVE)).toBeDefined();
    });

    it('returns undefined for a provider without a logo', () => {
        expect(getProviderLogo(ImportProvider.DEFAULT, ImportType.DRIVE)).toBeUndefined();
    });
});

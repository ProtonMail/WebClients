import { ApiImportProvider } from '../api/api.interface';
import { ImportProvider } from '../interface';
import { getImportProviderFromApiProvider } from './getImportProviderFromApiProvider';

describe('getImportProviderFromApiProvider', () => {
    it('Should return Google provider', () => {
        expect(getImportProviderFromApiProvider(ApiImportProvider.GOOGLE)).toBe(ImportProvider.GOOGLE);
    });
    it('Should return Outlook provider', () => {
        expect(getImportProviderFromApiProvider(ApiImportProvider.OUTLOOK)).toBe(ImportProvider.OUTLOOK);
    });
    it('Should return IMAP provider', () => {
        expect(getImportProviderFromApiProvider(ApiImportProvider.IMAP)).toBe(ImportProvider.DEFAULT);
    });
});

import { ImportProvider, ImportType } from '../../../../interface';
import { isDriveOnlyDraft } from './isDriveOnlyDraft';

describe('isDriveOnlyDraft', () => {
    it('is true only for a Google draft importing Drive alone', () => {
        expect(isDriveOnlyDraft({ provider: ImportProvider.GOOGLE, products: [ImportType.DRIVE] })).toBe(true);
    });

    it('is false for any other provider or product combination', () => {
        expect(isDriveOnlyDraft({ provider: ImportProvider.YAHOO, products: [ImportType.DRIVE] })).toBe(false);
        expect(isDriveOnlyDraft({ provider: ImportProvider.GOOGLE, products: [ImportType.MAIL] })).toBe(false);
        expect(
            isDriveOnlyDraft({ provider: ImportProvider.GOOGLE, products: [ImportType.DRIVE, ImportType.MAIL] })
        ).toBe(false);
        expect(isDriveOnlyDraft({ provider: ImportProvider.GOOGLE, products: [] })).toBe(false);
        expect(isDriveOnlyDraft({ provider: ImportProvider.GOOGLE })).toBe(false);
    });
});

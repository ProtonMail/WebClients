import { ImportProvider, ImportType } from '../../../../interface';
import { driveOAuthViewsOverride } from './driveOAuthViews';

describe('driveOAuthViewsOverride', () => {
    it('only activates for a Google-only Drive draft', () => {
        expect(driveOAuthViewsOverride.matches({ provider: ImportProvider.GOOGLE, products: [ImportType.DRIVE] })).toBe(
            true
        );
        expect(driveOAuthViewsOverride.matches({ provider: ImportProvider.GOOGLE, products: [ImportType.MAIL] })).toBe(
            false
        );
    });

    it('keeps LoadingImporter, Prepare and Success on the same component so it stays mounted across those steps', () => {
        const { Instructions, LoadingImporter, Prepare, Success } = driveOAuthViewsOverride.views;

        expect(typeof LoadingImporter).toBe('function');
        expect(Prepare).toBe(LoadingImporter);
        expect(Success).toBe(LoadingImporter);
        expect(Instructions).not.toBe(LoadingImporter);
    });
});

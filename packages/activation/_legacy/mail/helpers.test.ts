import { ImportedMailFolder } from '@proton/activation/interface';

import { getFolderRelationshipsMap } from './helpers';

describe('EasySwitch mail helpers', () => {
    describe('getFolderRelationshipsMap', () => {
        it('should resolve normal relationship', () => {
            const folders = [
                {
                    Source: 'Test',
                    Separator: '/',
                },
                {
                    Source: 'Test/Test',
                    Separator: '/',
                },
            ] as ImportedMailFolder[];

            const result = getFolderRelationshipsMap(folders);

            expect(result).toEqual({ Test: ['Test/Test'], 'Test/Test': [] });
        });

        it('should not match same start but not matching separator', () => {
            const folders = [
                {
                    Source: 'Test',
                    Separator: '/',
                },
                {
                    Source: 'Test2',
                    Separator: '/',
                },
                {
                    Source: 'Test2/Child',
                    Separator: '/',
                },
            ] as ImportedMailFolder[];

            const result = getFolderRelationshipsMap(folders);

            expect(result).toEqual({ Test: [], Test2: ['Test2/Child'], 'Test2/Child': [] });
        });

        it('should match children containing separators', () => {
            const folders = [
                {
                    Source: 'Test',
                    Separator: '/',
                },
                {
                    Source: 'Test/Test/with/separators',
                    Separator: '/',
                },
            ] as ImportedMailFolder[];

            const result = getFolderRelationshipsMap(folders);

            expect(result).toEqual({ Test: ['Test/Test/with/separators'], 'Test/Test/with/separators': [] });
        });
    });
});

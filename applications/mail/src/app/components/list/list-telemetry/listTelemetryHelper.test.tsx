import type { Folder, Label } from '@proton/shared/lib/interfaces';

import { folderLocation } from './listTelemetryHelper';

describe('useListTelemetry', () => {
    describe('folderLocation', () => {
        it('should return INBOX', () => {
            const val = folderLocation('0');
            expect(val).toBe('INBOX');
        });

        it('should return TRASH', () => {
            const val = folderLocation('3');
            expect(val).toBe('TRASH');
        });

        it('should return NEWSLETTER-SUBSCRIPTIONS', () => {
            const val = folderLocation('views/newsletters');
            expect(val).toBe('NEWSLETTER-SUBSCRIPTIONS');
        });

        it('should return CUSTOM_FOLDER', () => {
            const val = folderLocation('FOLDER', [], [{ ID: 'FOLDER' } as Folder]);
            expect(val).toBe('CUSTOM_FOLDER');
        });

        it('should return CUSTOM_LABEL', () => {
            const val = folderLocation('LABEL', [{ ID: 'LABEL' } as Label], []);
            expect(val).toBe('CUSTOM_LABEL');
        });

        it('should return CUSTOM_FOLDER', () => {
            const val = folderLocation('FOLDER', [{ ID: 'LABEL' } as Label], [{ ID: 'FOLDER' } as Folder]);
            expect(val).toBe('CUSTOM_FOLDER');
        });
    });
});

import { BRAND_NAME } from '@proton/shared/lib/constants';

import { getStorageFull } from './helperStorageBanner';

describe('getStorageFull', () => {
    describe('Mode drive', () => {
        it('Should return drive string for full storage', () => {
            const cta = 'Upgrade';

            const string = getStorageFull({
                percentage: 110,
                mode: 'drive',
                app: 'proton-drive',
                upgrade: cta,
            });

            expect((string as string[]).join('')).toBe(
                `Your Drive storage is full. To upload or sync files, free up space or ${cta}.`
            );
        });

        it('Should return drive string for near full storage', () => {
            const cta = 'Upgrade';

            const string = getStorageFull({
                percentage: 90,
                mode: 'drive',
                app: 'proton-drive',
                upgrade: cta,
            });

            expect((string as string[]).join('')).toBe(
                `Your Drive storage is 90% full. To upload or sync files, free up space or ${cta}.`
            );
        });
    });

    describe('Mode mail', () => {
        it('Should return mail string for full storage', () => {
            const cta = 'Upgrade';

            const string = getStorageFull({
                percentage: 110,
                mode: 'mail',
                app: 'proton-mail',
                upgrade: cta,
            });

            expect((string as string[]).join('')).toBe(
                `Your Mail storage is full. To continue using ${BRAND_NAME} products, free up space or ${cta}.`
            );
        });

        it('Should return mail string for near full storage', () => {
            const cta = 'Upgrade';

            const string = getStorageFull({
                percentage: 90,
                mode: 'mail',
                app: 'proton-mail',
                upgrade: cta,
            });

            expect((string as string[]).join('')).toBe(
                `Your Mail storage is 90% full. To continue using ${BRAND_NAME} products, free up space or ${cta}.`
            );
        });
    });

    describe('Mode both', () => {
        it('Should return drive string for full storage', () => {
            const cta = 'Upgrade';

            const string = getStorageFull({
                percentage: 110,
                mode: 'drive',
                app: 'proton-drive',
                upgrade: cta,
            });

            expect((string as string[]).join('')).toBe(
                `Your Drive storage is full. To upload or sync files, free up space or ${cta}.`
            );
        });

        it('Should return drive string for near full storage', () => {
            const cta = 'Upgrade';

            const string = getStorageFull({
                percentage: 90,
                mode: 'drive',
                app: 'proton-drive',
                upgrade: cta,
            });

            expect((string as string[]).join('')).toBe(
                `Your Drive storage is 90% full. To upload or sync files, free up space or ${cta}.`
            );
        });

        it('Should return drive string for full storage when on Mail app', () => {
            const cta = 'Upgrade';

            const string = getStorageFull({
                percentage: 110,
                mode: 'drive',
                app: 'proton-mail',
                upgrade: cta,
            });

            expect((string as string[]).join('')).toBe(
                `Your Drive storage is full. To upload or sync files, free up space or ${cta}.`
            );
        });

        it('Should return drive string for near full storage when on Mail app', () => {
            const cta = 'Upgrade';

            const string = getStorageFull({
                percentage: 90,
                mode: 'drive',
                app: 'proton-mail',
                upgrade: cta,
            });

            expect((string as string[]).join('')).toBe(
                `Your Drive storage is 90% full. To upload or sync files, free up space or ${cta}.`
            );
        });

        it('Should return mail string for full storage', () => {
            const cta = 'Upgrade';

            const string = getStorageFull({
                percentage: 110,
                mode: 'mail',
                app: 'proton-mail',
                upgrade: cta,
            });

            expect((string as string[]).join('')).toBe(
                `Your Mail storage is full. To continue using ${BRAND_NAME} products, free up space or ${cta}.`
            );
        });

        it('Should return mail string for near full storage', () => {
            const cta = 'Upgrade';

            const string = getStorageFull({
                percentage: 90,
                mode: 'mail',
                app: 'proton-mail',
                upgrade: cta,
            });

            expect((string as string[]).join('')).toBe(
                `Your Mail storage is 90% full. To continue using ${BRAND_NAME} products, free up space or ${cta}.`
            );
        });

        it('Should return mail string for full storage when on Drive app', () => {
            const cta = 'Upgrade';

            const string = getStorageFull({
                percentage: 110,
                mode: 'mail',
                app: 'proton-drive',
                upgrade: cta,
            });

            expect((string as string[]).join('')).toBe(
                `Your Mail storage is full. To continue using ${BRAND_NAME} products, free up space or ${cta}.`
            );
        });

        it('Should return drive string for near full storage when on Mail app', () => {
            const cta = 'Upgrade';

            const string = getStorageFull({
                percentage: 90,
                mode: 'mail',
                app: 'proton-drive',
                upgrade: cta,
            });

            expect((string as string[]).join('')).toBe(
                `Your Mail storage is 90% full. To continue using ${BRAND_NAME} products, free up space or ${cta}.`
            );
        });
    });
});

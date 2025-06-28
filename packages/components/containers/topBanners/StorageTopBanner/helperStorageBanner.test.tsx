import { BRAND_NAME } from '@proton/shared/lib/constants';

import { getPooledStorageBannerText, getSplitStorageBannerText } from './helperStorageBanner';

describe('generateStorageBannerText', () => {
    describe('getPooledStorageBannerText', () => {
        it('Should return mail string for full storage', () => {
            const cta = 'Upgrade';

            const string = getPooledStorageBannerText({
                percentage: 110,
                upgrade: cta,
            });

            expect((string as string[]).join('')).toBe(
                `Your storage is full. To continue using ${BRAND_NAME} products, free up space or ${cta}.`
            );
        });

        it('Should return mail string for near full storage', () => {
            const cta = 'Upgrade';

            const string = getPooledStorageBannerText({
                percentage: 90,
                upgrade: cta,
            });

            expect((string as string[]).join('')).toBe(
                `Your storage is 90% full. To continue using ${BRAND_NAME} products, free up space or ${cta}.`
            );
        });
    });

    describe('getSplitStorageBannerText', () => {
        describe('Mode drive', () => {
            it('Should return drive for full storage', () => {
                const cta = 'Upgrade';

                const string = getSplitStorageBannerText({
                    percentage: 110,
                    mode: 'drive',
                    upgrade: cta,
                });

                expect((string as string[]).join('')).toBe(
                    `Your Drive storage is full. To upload or sync files, free up space or ${cta}.`
                );
            });

            it('Should return drive for near full storage', () => {
                const cta = 'Upgrade';

                const string = getSplitStorageBannerText({
                    percentage: 90,
                    mode: 'drive',
                    upgrade: cta,
                });

                expect((string as string[]).join('')).toBe(
                    `Your Drive storage is 90% full. To upload or sync files, free up space or ${cta}.`
                );
            });
        });

        describe('Mode mail', () => {
            it('Should return mail for full storage', () => {
                const cta = 'Upgrade';

                const string = getSplitStorageBannerText({
                    percentage: 110,
                    mode: 'mail',
                    upgrade: cta,
                });

                expect((string as string[]).join('')).toBe(
                    `Your Mail storage is full. To send or receive emails, free up space or ${cta}.`
                );
            });

            it('Should return mail for near full storage', () => {
                const cta = 'Upgrade';

                const string = getSplitStorageBannerText({
                    percentage: 90,
                    mode: 'mail',
                    upgrade: cta,
                });

                expect((string as string[]).join('')).toBe(
                    `Your Mail storage is 90% full. To send or receive emails, free up space or ${cta}.`
                );
            });
        });

        describe('Mode both', () => {
            it('Should return drive for full storage', () => {
                const cta = 'Upgrade';

                const string = getSplitStorageBannerText({
                    percentage: 110,
                    mode: 'both',
                    upgrade: cta,
                });

                expect((string as string[]).join('')).toBe(
                    `Your storage is full. To continue using ${BRAND_NAME} products, free up space or ${cta}.`
                );
            });

            it('Should return drive for near full storage', () => {
                const cta = 'Upgrade';

                const string = getSplitStorageBannerText({
                    percentage: 90,
                    mode: 'both',
                    upgrade: cta,
                });

                expect((string as string[]).join('')).toBe(
                    `Your storage is 90% full. To continue using ${BRAND_NAME} products, free up space or ${cta}.`
                );
            });
        });
    });
});

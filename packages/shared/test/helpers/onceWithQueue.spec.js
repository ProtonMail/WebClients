import { wait } from '../../lib/helpers/promise';
import { onceWithQueue } from '../../lib/helpers/onceWithQueue';

const DELAY = 10;

describe('onceWithQueue', () => {
    it('should only execute once if the callback is already queued', async () => {
        let count = 0;

        const cb = onceWithQueue(async () => {
            await wait(DELAY);
            count++;
        });

        cb();
        cb();
        cb();
        cb();
        cb();
        cb();

        await wait(DELAY);
        expect(count).toEqual(1);
    });

    it('should only execute once more if another callback is queued', async () => {
        let count = 0;

        const cb = onceWithQueue(async () => {
            await wait(DELAY);
            count++;
        });

        cb();
        cb();
        cb();
        cb();
        cb();
        cb();

        await wait(DELAY);

        expect(count).toEqual(1);

        await wait(DELAY + 1);

        expect(count).toEqual(2);

        await wait(DELAY * 2);

        expect(count).toEqual(2);
    });

    it('should await for its own callback', async () => {
        let count = 0;

        const cb = onceWithQueue(async () => {
            await wait(DELAY);
            count++;
        });

        const p1 = cb().then(() => {
            expect(count).toEqual(1);
        });

        const p2 = cb().then(() => {
            expect(count).toEqual(2);
        });

        const p3 = cb().then(() => {
            expect(count).toEqual(2);
        });

        const p4 = cb().then(() => {
            expect(count).toEqual(2);
        });

        await Promise.all([p1, p2, p3, p4]);

        await cb().then(() => {
            expect(count).toEqual(3);
        });
    });
});

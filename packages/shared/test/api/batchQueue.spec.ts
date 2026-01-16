import { BatchQueue } from '../../lib/helpers/batchQueue';

describe('BatchQueue', () => {
    it('should be able to add items to the queue and flush them automatically', async () => {
        jasmine.clock().install();
        const fakeCallback = jasmine.createSpy('fakeCallback');
        const queue = new BatchQueue<number>({
            batchSize: 5,
            flushCallback: fakeCallback,
            flushIntervalMs: 500,
        });

        queue.add(1);
        queue.add(2);
        queue.add(3);
        queue.add(4);
        queue.add(5);

        expect(fakeCallback).toHaveBeenCalledTimes(1);
        expect(fakeCallback).toHaveBeenCalledWith([1, 2, 3, 4, 5]);

        queue.add(6);

        jasmine.clock().tick(510);

        expect(fakeCallback).toHaveBeenCalledTimes(2);
        expect(fakeCallback).toHaveBeenCalledWith([6]);

        jasmine.clock().uninstall();
    });
});

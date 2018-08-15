import { createCancellationToken } from '../../../src/helpers/promiseHelper';

const delay = (value, ms) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

describe('createCancellationToken', () => {

    it('should not throw an error when not cancelling', () => {
        const token = createCancellationToken();
        expect(token.check).to.not.throw();
        expect(token.isCancelled()).toBe(false);
    });


    it('should throw an error when cancelling', async () => {
        const token = createCancellationToken();
        token.cancel('Hello world');
        expect(token.check).to.throw();
        expect(token.isCancelled()).toBe(true);
    });

    it('should trigger the timeout when canceling', async () => {
        const token = createCancellationToken();
        token.cancel('Hello world');
        // should resolve immediately
        const result = await Promise.all([token.getCancelEvent(), delay('Bye world', 10)]);
        expect(result).toBe('Hello world');

        // should resolve immediately the second time too
        const result2 = await Promise.all([token.getCancelEvent(), delay('Bye world', 10)]);
        expect(result2).toBe('Hello world');
    });
});

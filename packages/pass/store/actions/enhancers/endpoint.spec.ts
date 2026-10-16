import { withIntentSender, withSender } from './endpoint';

describe('withIntentSender', () => {
    const result = { type: 'test::failure', payload: { id: 'id' } };

    test('should forward the intent sender to the result action', () => {
        const intent = withSender({ endpoint: 'page', tabId: 42 })({ type: 'test::intent' });

        expect(withIntentSender(result, intent)).toStrictEqual({
            type: 'test::failure',
            payload: { id: 'id' },
            meta: { sender: { endpoint: 'page', tabId: 42 } },
        });
    });

    test('should leave the result action untouched when the intent has no sender', () => {
        expect(withIntentSender(result, { type: 'test::intent' })).toBe(result);
    });
});

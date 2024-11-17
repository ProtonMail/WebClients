import { withAsyncRequest, withRequest, withRequestProgress, withRevalidate } from './enhancers';

describe('request enhancers', () => {
    describe('withRequestProgress', () => {
        test('should include progress metadata', () => {
            const actionPreparator = withRequestProgress(() => ({ payload: {} }));
            const action = actionPreparator('request-id', 2);
            expect(action.meta.request.progress).toEqual(2);
        });
    });

    describe('withRevalidate', () => {
        test('should include revalidation flag', () => {
            const action = withRequest({ status: 'start', id: 'request-id' })({ type: 'test-action' });
            const revalidatedAction = withRevalidate(action);
            expect(revalidatedAction.meta.request.revalidate).toEqual(true);
        });
    });

    describe('withAsyncRequest', () => {
        test('should include async flag', () => {
            const action = withRequest({ status: 'start', id: 'request-id' })({ type: 'test-action' });
            const revalidatedAction = withAsyncRequest(action);
            expect(revalidatedAction.meta.request.async).toEqual(true);
        });
    });
});

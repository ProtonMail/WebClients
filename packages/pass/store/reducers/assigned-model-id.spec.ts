import { assignedModelIdUpdated } from '../actions/creators/assigned-model-id';
import { selectAssignedModelId } from '../selectors/assigned-model-id';
import reducer from './assigned-model-id';

describe('`assignedModelId` reducer', () => {
    test('defaults to `null`', () => {
        expect(reducer(undefined, { type: '__INIT__' } as any)).toBeNull();
    });

    test('stores the dispatched model ID', () => {
        expect(reducer(null, assignedModelIdUpdated('2026.10.1-lr'))).toBe('2026.10.1-lr');
    });

    test('ignores unrelated actions', () => {
        expect(reducer('2026.10.1-lr', { type: 'unrelated' } as any)).toBe('2026.10.1-lr');
    });

    test('round-trips through `selectAssignedModelId`', () => {
        const state = reducer(null, assignedModelIdUpdated('2026.10.1-lr'));
        expect(selectAssignedModelId({ assignedModelId: state } as any)).toBe('2026.10.1-lr');
    });
});

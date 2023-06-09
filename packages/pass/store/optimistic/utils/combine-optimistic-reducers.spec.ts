import type { Reducer } from 'redux';

import type { WithOptimisticReducer } from '../types';
import { combineOptimisticReducers } from './combine-optimistic-reducers';

describe('combineOptimisticReducers', () => {
    test('should keep a reference to the underlying "reducer state structure"', () => {
        const reducer: Reducer = () => {};

        const optimisticReducer: WithOptimisticReducer = () => {};
        optimisticReducer.innerReducer = () => {};

        const nestedOptimisticCombinedReducer = combineOptimisticReducers({
            nestedOptimisticTest: optimisticReducer,
            nestedTest: reducer,
        });

        const reducersMap = {
            nestedOptimisticCombinedReducer,
            optimisticTest: optimisticReducer,
            test: reducer,
        };

        const rootReducer = combineOptimisticReducers(reducersMap);
        expect(rootReducer.innerCombinedReducers).toEqual(reducersMap);
    });
});

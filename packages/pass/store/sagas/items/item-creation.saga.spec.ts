import { runSaga } from 'redux-saga';

import { itemBuilder } from '../../../lib/items/item.builder';
import type { ItemCreateIntent } from '../../../types/data/items.dto';
import { sagaSetup } from '../../../utils/tests/saga';
import { itemCreate } from '../../actions/creators/item';
import { withSender } from '../../actions/enhancers/endpoint';
import type { RootSagaOptions } from '../../types';
import watcher from './item-creation.saga';

describe('item creation saga', () => {
    const options = { getTelemetry: () => null } as unknown as RootSagaOptions;

    const intent: ItemCreateIntent<'note'> = {
        ...itemBuilder('note').data,
        optimisticId: 'optimistic-id',
        shareId: 'missing-share',
        files: { toAdd: [], toRemove: [] },
        extraData: {},
        folderId: null,
    } as ItemCreateIntent<'note'>;

    const runCreation = async (action: ReturnType<typeof itemCreate.intent>) => {
        const saga = sagaSetup({ shares: {} });
        const task = runSaga(saga.options, watcher, options);
        saga.options.dispatch(action);
        await saga.nextTick();
        task.cancel();
        await task.toPromise();
        return saga.dispatched.find(itemCreate.failure.match);
    };

    test('should forward the intent sender to the failure so the page gets its notification', async () => {
        const action = withSender({ endpoint: 'page', tabId: 7 })(itemCreate.intent(intent));
        const failure = await runCreation(action);

        expect(failure?.payload).toStrictEqual({ optimisticId: 'optimistic-id', shareId: 'missing-share' });
        expect(failure?.meta).toMatchObject({ sender: { endpoint: 'page', tabId: 7 } });
    });

    test('should not tag the failure with a sender when the intent has none', async () => {
        const failure = await runCreation(itemCreate.intent(intent));

        expect(failure?.payload).toStrictEqual({ optimisticId: 'optimistic-id', shareId: 'missing-share' });
        expect(failure?.meta).not.toHaveProperty('sender');
    });
});

import { describe, it } from 'mocha';
import assert from 'assert';

import createEventManager from '../../lib/eventManager/eventManager';
import { createSpy } from '../spy';

const mockApi = (responses) => {
    let i = 0;
    return createSpy(async () => {
        const response = responses[i++];
        if (response instanceof Error) {
            throw response;
        }
        return response;
    });
};

/**
 * TODO: More tests when https://stackoverflow.com/a/50785284 exists
 */
describe('event manager', () => {
    it('should call more and not finish until it is done', async () => {
        const api = mockApi([
            { EventID: '1', More: 1 },
            { EventID: '2', More: 1 },
            { EventID: '3', More: 1 },
            { EventID: '4', More: 1 },
            { EventID: '5', More: 1 },
            { EventID: '6', More: 0 },
            { EventID: '6', More: 0 }
        ]);

        const onSuccess = createSpy();

        const eventManager = createEventManager({
            eventID: '1',
            api,
            onSuccess,
            interval: 1000
        });

        eventManager.start();

        await eventManager.call();

        assert.deepStrictEqual(api.calls.length, 6);
        assert.deepStrictEqual(onSuccess.calls.length, 6);

        await eventManager.call();

        assert.deepStrictEqual(api.calls.length, 7);
        assert.deepStrictEqual(onSuccess.calls.length, 7);

        eventManager.stop();
    });
});

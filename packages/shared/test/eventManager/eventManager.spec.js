import createEventManager from '../../lib/eventManager/eventManager';

const mockApi = (responses) => {
    let i = 0;
    const cb = async () => {
        const response = responses[i++];
        if (response instanceof Error) {
            throw response;
        }
        return response;
    };
    return jasmine.createSpy('mockApi').and.callFake(cb);
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

        const onSuccess = jasmine.createSpy();

        const eventManager = createEventManager({
            eventID: '1',
            api,
            onSuccess,
            interval: 1000
        });

        eventManager.start();

        await eventManager.call();

        expect(api.calls.all().length).toEqual(6);
        expect(onSuccess.calls.all().length).toEqual(6);

        await eventManager.call();

        expect(api.calls.all().length, 7);
        expect(onSuccess.calls.all().length, 7);

        eventManager.stop();
    });
});

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
        const getEvents = mockApi([
            { EventID: '1', More: 1 },
            { EventID: '2', More: 1 },
            { EventID: '3', More: 1 },
            { EventID: '4', More: 1 },
            { EventID: '5', More: 1 },
            { EventID: '6', More: 0 },
            { EventID: '6', More: 0 },
        ]);

        const eventManager = createEventManager({
            eventID: '1',
            getEvents,
            interval: 1000,
        });
        const onSuccess = jasmine.createSpy();
        const unsubscribe = eventManager.subscribe(onSuccess);

        eventManager.start();

        await eventManager.call();

        expect(getEvents.calls.all().length).toEqual(6);
        expect(onSuccess.calls.all().length).toEqual(6);

        await eventManager.call();

        expect(getEvents.calls.all().length, 7);
        expect(onSuccess.calls.all().length, 7);

        eventManager.stop();
        unsubscribe();
    });

    it('should call getLatestEventID to get the event ID when it is not passed', async () => {
        const getEvents = mockApi([
            { EventID: '2', More: 0 },
            { EventID: '3', More: 0 },
        ]);
        const getLatestEventID = jasmine.createSpy('getLatestEventID').and.callFake(() => '1');

        const eventManager = createEventManager({
            getLatestEventID,
            getEvents,
            interval: 1000,
        });
        const onSuccess = jasmine.createSpy();
        const unsubscribe = eventManager.subscribe(onSuccess);

        // Should make one call initially
        expect(getLatestEventID.calls.all().length).toEqual(1);

        eventManager.start();

        // Should wait for that call to finish
        await eventManager.call();

        expect(getLatestEventID.calls.all().length).toEqual(1);
        expect(getEvents.calls.all().length).toEqual(1);

        await eventManager.call();

        expect(getLatestEventID.calls.all().length).toEqual(1);
        expect(getEvents.calls.all().length).toEqual(2);

        eventManager.stop();
        unsubscribe();
    });
});

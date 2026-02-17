import createEventManager from '../../lib/eventManager/eventManager';

const mockApi = (responses: any) => {
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
            intervals: { foreground: 1000, background: 1000 },
        });
        const onSuccess = jasmine.createSpy();
        const unsubscribe = eventManager.subscribe(onSuccess);

        eventManager.start();

        await eventManager.call();

        expect(getEvents).toHaveBeenCalledTimes(6);
        expect(onSuccess).toHaveBeenCalledTimes(6);

        await eventManager.call();

        expect(getEvents).toHaveBeenCalledTimes(7);
        expect(onSuccess).toHaveBeenCalledTimes(7);

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
            intervals: { foreground: 1000, background: 1000 },
        });
        const onSuccess = jasmine.createSpy();
        const unsubscribe = eventManager.subscribe(onSuccess);

        // Should make one call initially
        expect(getLatestEventID).toHaveBeenCalledTimes(1);

        eventManager.start();

        // Should wait for that call to finish
        await eventManager.call();

        expect(getLatestEventID).toHaveBeenCalledTimes(1);
        expect(getEvents).toHaveBeenCalledTimes(1);

        await eventManager.call();

        expect(getLatestEventID).toHaveBeenCalledTimes(1);
        expect(getEvents).toHaveBeenCalledTimes(2);

        eventManager.stop();
        unsubscribe();
    });
});

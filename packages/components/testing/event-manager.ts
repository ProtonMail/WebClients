import type { EventManager } from '@proton/shared/lib/eventManager/eventManager';

export const mockEventManager: EventManager<any> = {
    call: jest.fn().mockReturnValue(Promise.resolve()),
    setEventID: jest.fn(),
    getEventID: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
    subscribe: jest.fn(),
};

import { ES_SYNC_ACTIONS } from '@proton/encrypted-search/constants';
import type { ESEvent, ESItemEvent } from '@proton/encrypted-search/models/interfaces';

import { MAIL_EVENTLOOP_NAME } from '../../constants';
import type { ESBaseMessage } from '../../models/encryptedSearch';
import type { Logger } from '../utils/logger';
import { EventUpdateMapper } from './EventUpdateMapper';

class FakeLogger implements Logger {
    trace = vi.fn();
    debug = vi.fn();
    info = vi.fn();
    warn = vi.fn();
    error = vi.fn();
    log = vi.fn();
}

const getESEvent = (items: any[] | undefined, eventID: string, Refresh = 0): ESEvent<ESBaseMessage> => {
    return {
        Refresh,
        Items: items,
        attemptReDecryption: false,
        eventsToStore: {
            [MAIL_EVENTLOOP_NAME]: eventID,
        },
    };
};

const getItem = (action: ES_SYNC_ACTIONS, id: string): ESItemEvent<{ id: string }> => {
    return {
        Action: action,
        ItemMetadata: { id },
        ID: id,
    };
};

describe('EventUpdateMapper', () => {
    it('should return undefined when event is undefined', () => {
        const eventMapper = new EventUpdateMapper(new FakeLogger());

        const result = eventMapper.map(undefined);
        expect(result).toBeUndefined();
    });

    it('should handle update content event correctly', () => {
        const items = [getItem(ES_SYNC_ACTIONS.UPDATE_CONTENT, 'message-0')];
        const eventMapper = new EventUpdateMapper(new FakeLogger());

        const result = eventMapper.map(getESEvent(items, 'event-id'));
        expect(result?.items[0]).toEqual({ metadata: { id: items[0].ID }, fetchBodyId: items[0].ID });
    });

    it('should handle update metadata event correctly', () => {
        const items = [getItem(ES_SYNC_ACTIONS.UPDATE_METADATA, 'message-0')];
        const eventMapper = new EventUpdateMapper(new FakeLogger());

        const result = eventMapper.map(getESEvent(items, 'event-id'));
        expect(result?.items[0]).toEqual({ metadata: { id: items[0].ID } });
    });

    it('should handle delete event correctly', () => {
        const items = [getItem(ES_SYNC_ACTIONS.DELETE, 'message-0')];
        const eventMapper = new EventUpdateMapper(new FakeLogger());

        const result = eventMapper.map(getESEvent(items, 'event-id'));
        expect(result?.items[0]).toEqual({ deleteId: items[0].ID });
    });

    it('should handle create event correctly', () => {
        const items = [getItem(ES_SYNC_ACTIONS.CREATE, 'message-0')];
        const eventMapper = new EventUpdateMapper(new FakeLogger());

        const result = eventMapper.map(getESEvent(items, 'event-id'));
        expect(result?.items[0]).toEqual({ metadata: { id: items[0].ID }, fetchBodyId: items[0].ID });
    });

    it('should map multiple items correctly', () => {
        const items = [
            getItem(ES_SYNC_ACTIONS.UPDATE_CONTENT, 'message-0'),
            getItem(ES_SYNC_ACTIONS.UPDATE_METADATA, 'message-1'),
            getItem(ES_SYNC_ACTIONS.DELETE, 'message-2'),
            getItem(ES_SYNC_ACTIONS.CREATE, 'message-3'),
        ];
        const eventMapper = new EventUpdateMapper(new FakeLogger());

        const result = eventMapper.map(getESEvent(items, 'event-id'));
        expect(result?.items[0]).toEqual({ metadata: { id: items[0].ID }, fetchBodyId: items[0].ID });
        expect(result?.items[1]).toEqual({ metadata: { id: items[1].ID } });
        expect(result?.items[2]).toEqual({ deleteId: items[2].ID });
        expect(result?.items[3]).toEqual({ metadata: { id: items[3].ID }, fetchBodyId: items[3].ID });
    });

    it('should log missing ItemMetadata when handling update metadata event', () => {
        const logger = new FakeLogger();
        const items = [{ ...getItem(ES_SYNC_ACTIONS.UPDATE_METADATA, 'message-0'), ItemMetadata: undefined }];
        const eventMapper = new EventUpdateMapper(logger);

        const result = eventMapper.map(getESEvent(items, 'event-id'));
        expect(result?.items).toEqual([]);
        expect(logger.error).toHaveBeenCalledWith(
            'received metadata update from event loop but metadata not present for message message-0'
        );
    });

    it('should log missing ItemMetadata when handling update content event', () => {
        const logger = new FakeLogger();
        const items = [{ ...getItem(ES_SYNC_ACTIONS.UPDATE_CONTENT, 'message-0'), ItemMetadata: undefined }];
        const eventMapper = new EventUpdateMapper(logger);

        const result = eventMapper.map(getESEvent(items, 'event-id'));
        expect(result?.items).toEqual([]);
        expect(logger.error).toHaveBeenCalledWith(
            'received created or updated message from event loop but metadata not present for message message-0'
        );
    });

    it('should log missing ItemMetadata when handling create event', () => {
        const logger = new FakeLogger();
        const items = [{ ...getItem(ES_SYNC_ACTIONS.CREATE, 'message-0'), ItemMetadata: undefined }];
        const eventMapper = new EventUpdateMapper(logger);

        const result = eventMapper.map(getESEvent(items, 'event-id'));
        expect(result?.items).toEqual([]);
        expect(logger.error).toHaveBeenCalledWith(
            'received created or updated message from event loop but metadata not present for message message-0'
        );
    });

    it.each([undefined, []])('should return an update without items when the event has items %p', (items) => {
        const eventMapper = new EventUpdateMapper(new FakeLogger());

        const result = eventMapper.map(getESEvent(items, 'event-id'));
        expect(result).toEqual({ eventID: 'event-id', items: [], refresh: false });
    });

    it('should return undefined when the event has no event id', () => {
        const logger = new FakeLogger();
        const eventMapper = new EventUpdateMapper(logger);

        const result = eventMapper.map({ ...getESEvent([], 'event-id'), eventsToStore: {} });
        expect(result).toBeUndefined();
        expect(logger.warn).toHaveBeenCalled();
    });

    it.each([
        [0, false],
        [1, true],
        [255, true],
        [2, false],
    ])('should map refresh %i to %s', (refresh, expected) => {
        const eventMapper = new EventUpdateMapper(new FakeLogger());

        const result = eventMapper.map(getESEvent([], 'event-id', refresh));
        expect(result?.refresh).toBe(expected);
    });
});

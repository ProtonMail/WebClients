import { parseEventNotifierMessage } from '../../lib/eventNotifier/parseEventNotifierMessage';

describe('parseEventNotifierMessage', () => {
    it('should parse a hello frame', () => {
        expect(parseEventNotifierMessage('Hello', JSON.stringify({ id: 'connection-1' }))).toEqual({
            event: 'Hello',
            data: { id: 'connection-1' },
        });
    });

    it('should parse a ping frame', () => {
        expect(parseEventNotifierMessage('Ping', JSON.stringify({ type: 'mail', identifier: 'user-1' }))).toEqual({
            event: 'Ping',
            data: { type: 'mail', identifier: 'user-1' },
        });
    });

    it('should parse a ping frame without an identifier', () => {
        expect(parseEventNotifierMessage('Ping', JSON.stringify({ type: 'legacy' }))).toEqual({
            event: 'Ping',
            data: { type: 'legacy', identifier: '' },
        });
    });

    it('should parse a goodbye frame, which carries no data', () => {
        expect(parseEventNotifierMessage('Goodbye', undefined)).toEqual({ event: 'Goodbye' });
        expect(parseEventNotifierMessage('Goodbye', '')).toEqual({ event: 'Goodbye' });
    });

    it('should parse an error frame, whose data is a plain string', () => {
        expect(parseEventNotifierMessage('Error', 'something went wrong')).toEqual({
            event: 'Error',
            data: 'something went wrong',
        });
    });

    it('should drop a ping frame for an unknown loop type', () => {
        expect(parseEventNotifierMessage('Ping', JSON.stringify({ type: 'unknown' }))).toBeUndefined();
    });

    it('should drop a hello frame without a connection id', () => {
        expect(parseEventNotifierMessage('Hello', JSON.stringify({}))).toBeUndefined();
        expect(parseEventNotifierMessage('Hello', JSON.stringify({ id: '' }))).toBeUndefined();
    });

    it('should drop frames with malformed data', () => {
        expect(parseEventNotifierMessage('Hello', 'not json')).toBeUndefined();
        expect(parseEventNotifierMessage('Ping', JSON.stringify('a string'))).toBeUndefined();
        expect(parseEventNotifierMessage('Ping', JSON.stringify(null))).toBeUndefined();
        expect(parseEventNotifierMessage('Ping', undefined)).toBeUndefined();
    });

    it('should drop frames with an unknown event name', () => {
        expect(parseEventNotifierMessage('message', JSON.stringify({ type: 'mail' }))).toBeUndefined();
        expect(parseEventNotifierMessage('Whatever', '')).toBeUndefined();
    });
});

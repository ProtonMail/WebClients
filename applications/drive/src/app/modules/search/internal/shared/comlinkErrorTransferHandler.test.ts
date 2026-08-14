import * as Comlink from 'comlink';

import {
    AbortError as SdkAbortError,
    RateLimitedError as SdkRateLimitedError,
    ServerError as SdkServerError,
} from '@proton/drive';

import { registerComlinkErrorTransferHandler } from './comlinkErrorTransferHandler';
import { InvalidIndexerState, classifyError } from './errors';

// applications/drive/__mocks__/comlink.ts stubs the package for every drive test and exposes only
// proxy/wrap/expose, so transferHandlers is missing and registerComlinkErrorTransferHandler()
// silently no-ops. This suite needs the real registry to exercise the handler it installs.
jest.unmock('comlink');

describe('comlinkErrorTransferHandler', () => {
    beforeAll(() => {
        registerComlinkErrorTransferHandler();
    });

    /**
     * Drive an error through the real handler the way postMessage would: serialize on the throwing
     * side, structured-clone the payload, deserialize on the receiving side.
     */
    const roundTrip = (error: unknown): unknown => {
        const handler = Comlink.transferHandlers.get('throw');
        if (!handler) {
            throw new Error('comlink throw handler is not registered');
        }
        const [payload] = handler.serialize({ value: error });
        try {
            handler.deserialize(structuredClone(payload));
        } catch (e) {
            return e;
        }
        throw new Error('deserialize should have re-thrown');
    };

    it('delivers an error that has genuinely lost its identity', () => {
        const received = roundTrip(new SdkServerError('5xx'));

        // Guards against the round-trip becoming a no-op: if these ever pass by identity rather
        // than by bridged decision, the tests below stop proving anything.
        expect(received).not.toBeInstanceOf(SdkServerError);
        expect(received).toHaveProperty('name', 'Error');
    });

    it.each([
        ['ServerError', new SdkServerError('5xx'), { kind: 'transient', reason: 'server' }],
        ['RateLimitedError', new SdkRateLimitedError('429'), { kind: 'transient', reason: 'rate-limited' }],
        ['AbortError', new SdkAbortError('aborted'), { kind: 'transient', reason: 'abort' }],
        ['InvalidIndexerState', new InvalidIndexerState('bad'), { kind: 'permanent', reason: 'invalid_indexer_state' }],
    ])('classifies a %s correctly on the receiving side', (_name, error, expected) => {
        expect(classifyError(roundTrip(error))).toEqual(expected);
    });

    it('leaves an error nobody can classify as unknown', () => {
        expect(classifyError(roundTrip(new Error('mystery')))).toEqual({ kind: 'transient', reason: 'unknown' });
    });

    it.each([
        ['a string', 'boom'],
        ['undefined', undefined],
        ['null', null],
        ['a number', 42],
    ])('survives %s being thrown, which cannot hold a decision', (_label, value) => {
        expect(() => roundTrip(value)).not.toThrow();
        expect(classifyError(roundTrip(value))).toEqual({ kind: 'transient', reason: 'unknown' });
    });

    it('tolerates a payload from an endpoint that never registered this handler', () => {
        const handler = Comlink.transferHandlers.get('throw');
        if (!handler) {
            throw new Error('comlink throw handler is not registered');
        }

        // Comlink's default serializer emits no decision. Recording undefined would poison the
        // lookup, and other Drive workers share this global registry.
        expect(() => handler.deserialize({ isError: true, value: new Error('from elsewhere') })).toThrow(
            'from elsewhere'
        );
    });

    it('still preserves the cause chain, which is why this handler exists', () => {
        const received = roundTrip(new Error('outer', { cause: new Error('inner') }));

        expect(received).toHaveProperty('message', 'outer');
        expect(received).toHaveProperty('cause.message', 'inner');
    });
});

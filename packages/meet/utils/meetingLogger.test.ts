import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { meetingLogger } from './meetingLogger';

const mocks = vi.hoisted(() => {
    const lines: string[] = [];
    const createRecordingLogger = (prefix = ''): Record<string, unknown> => {
        const record = (message: string) => {
            lines.push(`${prefix}${message}`);
        };
        return {
            trace: record,
            debug: record,
            info: record,
            warn: record,
            error: record,
            log: record,
            withContext: (context: string) => createRecordingLogger(`${prefix}[${context}] `),
        };
    };
    return { lines, logger: createRecordingLogger() };
});

vi.mock('@protontech/logger', () => ({ logger: mocks.logger }));

const goTo = (path: string) => window.history.replaceState(null, '', path);

describe('meetingLogger', () => {
    beforeEach(() => {
        mocks.lines.length = 0;
    });

    afterEach(() => {
        goTo('/');
    });

    it('writes to the root logger outside a meeting URL', () => {
        goTo('/dashboard');

        meetingLogger.info('dashboard');

        expect(mocks.lines).toEqual(['dashboard']);
    });

    it('prefixes lines with the meetingLinkName of the meeting URL, never the password', () => {
        goTo('/guest/join/id-KNR6A31EBM#pwd-QegOR68VMwYx');

        meetingLogger.error('joined');

        expect(mocks.lines).toEqual(['[KNR6A31EBM] joined']);
    });

    it('reads the URL when each line is logged', () => {
        goTo('/join');
        meetingLogger.info('instant prejoin');
        goTo('/u/1/join/id-KNR6A31EBM');
        meetingLogger.info('in the meeting');
        goTo('/dashboard');
        meetingLogger.warn('left');

        expect(mocks.lines).toEqual(['instant prejoin', '[KNR6A31EBM] in the meeting', 'left']);
    });

    it('puts a nested context after the meetingLinkName', () => {
        const liveKitLogger = meetingLogger.withContext('livekit');

        goTo('/join');
        liveKitLogger.info('setting up e2ee');
        goTo('/join/id-KNR6A31EBM');
        liveKitLogger.info('signal connected');

        expect(mocks.lines).toEqual(['[livekit] setting up e2ee', '[KNR6A31EBM] [livekit] signal connected']);
    });

    it('writes to the root logger when the URL holds an invalid meeting id', () => {
        goTo('/join/id-short');

        meetingLogger.info('invalid link');

        expect(mocks.lines).toEqual(['invalid link']);
    });
});

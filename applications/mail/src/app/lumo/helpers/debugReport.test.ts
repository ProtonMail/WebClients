import { MIME_TYPES } from '@proton/shared/lib/constants';

import { buildDebugReportDraft } from './debugReport';

const reportInfo = {
    OS: 'Mac OS',
    OSVersion: '15.6',
    OSArtificial: false,
    Browser: 'Chrome',
    BrowserVersion: '141.0',
    Resolution: '900 x 1400',
    DeviceName: 'Apple',
    DeviceModel: 'Macintosh',
};

const transcript = [
    '===== SYSTEM =====',
    'You are Lumo. Use **bold** sparingly.',
    '',
    '===== TOOL_RESULT =====',
    '<div class="email">1 - 3 of 3</div>',
].join('\n');

describe('buildDebugReportDraft', () => {
    it('carries the client the run happened on', () => {
        const { bodyBeforeQuote } = buildDebugReportDraft({ transcript, reportInfo, appVersion: '5.0.99.9' });

        expect(bodyBeforeQuote).toContain('Mail 5.0.99.9 | Chrome 141.0 | Mac OS 15.6');
    });

    it('leaves the reporter blank space above a labelled environment block', () => {
        const { bodyBeforeQuote } = buildDebugReportDraft({ transcript, reportInfo, appVersion: '5.0.99.9' });
        const beforeEnvironment = bodyBeforeQuote.slice(0, bodyBeforeQuote.indexOf('===== ENVIRONMENT ====='));

        expect(beforeEnvironment).toMatch(/\S\n\n+$/);
    });

    it('labels the transcript so the reporter can tell it apart from their own words', () => {
        const { bodyBeforeQuote } = buildDebugReportDraft({ transcript, reportInfo, appVersion: '5.0.99.9' });

        expect(bodyBeforeQuote).toContain(`===== TRANSCRIPT =====\n${transcript}`);
    });

    it('carries the transcript verbatim, markdown and markup included', () => {
        const { bodyBeforeQuote } = buildDebugReportDraft({ transcript, reportInfo, appVersion: '5.0.99.9' });

        expect(bodyBeforeQuote).toContain(transcript);
    });

    // Plaintext is the whole reason the transcript survives: the HTML draft path parses and sanitises it.
    it('asks for a plaintext draft', () => {
        const { referenceMessage } = buildDebugReportDraft({ transcript, reportInfo, appVersion: '5.0.99.9' });

        expect(referenceMessage.data?.MIMEType).toBe(MIME_TYPES.PLAINTEXT);
    });
});

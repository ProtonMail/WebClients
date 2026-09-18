import type { getReportInfo } from '@proton/components/helpers/report';
import type { PartialMessageState } from '@proton/mail/store/messages/messagesTypes';
import { MIME_TYPES } from '@proton/shared/lib/constants';

const FEEDBACK_ADDRESS = 'lumomailfeedback@proton.ch';

const SUBJECT = 'Lumo In Mail report';

const DESCRIPTION_PROMPT = 'Please describe the issue you faced.';
const EXPECTED_PROMPT = 'Expected behaviour:';
const ACTUAL_PROMPT = 'Actual behaviour:';

const ENVIRONMENT_MARKER = '===== ENVIRONMENT =====';
const TRANSCRIPT_MARKER = '===== TRANSCRIPT =====';

const UNRECOGNISED_BROWSER = 'other';

type ReportInfo = ReturnType<typeof getReportInfo>;

interface DebugReportParams {
    transcript: string;
    reportInfo: ReportInfo;
    appVersion: string;
}

export interface DebugReportDraft {
    referenceMessage: PartialMessageState;
    bodyBeforeQuote: string;
}

/** The client the run happened on, so a report is reproducible without asking the tester what they had. */
const environment = ({ Browser, BrowserVersion, OS, OSVersion }: ReportInfo, appVersion: string) =>
    `Mail ${appVersion} | ${Browser ?? UNRECOGNISED_BROWSER} ${BrowserVersion} | ${OS} ${OSVersion}`;

export const buildDebugReportDraft = ({ transcript, reportInfo, appVersion }: DebugReportParams): DebugReportDraft => ({
    referenceMessage: {
        data: {
            ToList: [{ Name: FEEDBACK_ADDRESS, Address: FEEDBACK_ADDRESS }],
            Subject: SUBJECT,
            // Plaintext is what keeps the transcript verbatim: insertBodyIntoNewDraft runs an HTML
            // draft's body through the markdown parser and sanitiser, which eats tool calls and markup.
            MIMEType: MIME_TYPES.PLAINTEXT,
        },
    },
    bodyBeforeQuote: [
        DESCRIPTION_PROMPT,
        '',
        EXPECTED_PROMPT,
        '',
        '',
        ACTUAL_PROMPT,
        '',
        '',
        ENVIRONMENT_MARKER,
        environment(reportInfo, appVersion),
        '',
        TRANSCRIPT_MARKER,
        transcript,
    ].join('\n'),
});

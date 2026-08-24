import { AutofillMode } from '../../../types/protobuf';

type AutofillHelp = {
    url: string;
    examples: { url: string; match: boolean }[];
};

type AutofillHelpMap = Record<AutofillMode, AutofillHelp>;

/** This list has been made in order to show examples on the ui
 * Then, it has been replaced by a tester but we keep the values
 * at least for unit tests, and if maybe the idea comes back */
export const autofillHelp: AutofillHelpMap = {
    [AutofillMode.Default]: {
        url: 'https://subdomain.acme.com',
        examples: [
            { url: 'https://acme.com', match: true },
            { url: 'https://subdomain.acme.com', match: true },
            { url: 'https://acme.net', match: false },
            { url: 'https://google.com', match: false },
        ],
    },
    [AutofillMode.Exact]: {
        url: 'https://subdomain.acme.com',
        examples: [
            { url: 'https://subdomain.acme.com', match: true },
            { url: 'https://acme.com', match: false },
            { url: 'https://www.acme.com:5000', match: false },
            { url: 'https://acme.com/example', match: false },
        ],
    },
    [AutofillMode.ExactPath]: {
        url: 'https://subdomain.acme.com',
        examples: [
            { url: 'https://subdomain.acme.com', match: true },
            { url: 'https://subdomain.acme.com/path', match: false },
            { url: 'https://acme.com', match: false },
            { url: 'https://subdomain2.acme.com', match: false },
        ],
    },
    [AutofillMode.Never]: {
        url: 'https://subdomain.acme.com',
        examples: [
            { url: 'https://acme.com', match: false },
            { url: 'https://subdomain.acme.com', match: false },
            { url: 'https://acme.net', match: false },
            { url: 'https://google.com', match: false },
        ],
    },
    [AutofillMode.Pattern]: {
        url: 'https://subdomain*.acme.com/*',
        examples: [
            { url: 'https://subdomain.acme.com/path', match: true },
            { url: 'https://subdomain42.acme.com/path', match: true },
            { url: 'https://subdomain.acme.com/path/sub', match: false },
            { url: 'https://acme.com', match: false },
        ],
    },
    [AutofillMode.RegularExpression]: {
        url: 'subdomain\\d*\\.acme\\.com',
        examples: [
            { url: 'https://subdomain.acme.com', match: true },
            { url: 'https://subdomain42.acme.com', match: true },
            { url: 'https://subdomain.acme.com/path', match: true },
            { url: 'https://acme.com', match: false },
        ],
    },
    [AutofillMode.StartWith]: {
        url: 'https://subdomain.acme.com',
        examples: [
            { url: 'https://subdomain.acme.com', match: true },
            { url: 'https://subdomain.acme.com/path', match: true },
            { url: 'https://acme.com', match: false },
            { url: 'https://subdomain2.acme.com', match: false },
        ],
    },
};

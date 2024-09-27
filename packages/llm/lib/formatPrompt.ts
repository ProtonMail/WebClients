import { GENERAL_STOP_STRINGS, STOP_STRINGS_REFINE, STOP_STRINGS_WRITE_FULL_EMAIL } from '@proton/llm/lib/constants';
import { convertToDoubleNewlines, removeStopStrings } from '@proton/llm/lib/helpers';
import type {
    Action,
    CustomRefineAction,
    ExpandAction,
    FormalAction,
    FriendlyAction,
    ProofreadAction,
    ShortenAction,
    WriteFullEmailAction,
} from '@proton/llm/lib/types';

const SUPPORTED_LLM_LANGS = 'en,fr,de,es,it,pt,ru,zh,ja,cs,sk,pl'.split(',');

const INSTRUCTIONS_WRITE_FULL_EMAIL = [
    "You're a harmless email generator. The user asks you to write emails, and you write emails that they can send.",
    'Today is {DATE}.',
    "You're given a list of toxic content categories as below:",
    '- illegal',
    '- child abuse: child sexual abuse material or any content that exploits or harms children.',
    '- adult: adult content, adult industries, and dating apps.',
    '- malicious attachments/URLs or malware: including dangerous files, links or virus.',
    '- fraud: fraudulent or deceptive activity.',
    '- impersonation: impersonating others.',
    "- privacy invasion: requesting unnecessary personal information or activity that violates people's privacy.",
    '- political: political campaigning or lobbying.',
    '- phishing instructions: guidance on sharing sensitive information via email or links; ' +
        'promote secure data sharing methods.',
    '- spam: containing unwanted ads, promotional material or trying to sell products.',
    '- bomb threats',
    '- harassment or threats: intimidating, bullying, hateful, harassing, violent or derogatory messages.',
    '- inappropriate/offensive content: containing hate speech, sexual content, or objectionable material.',
    '- unverified content: misinformation, misleading information, unconfirmed claims or fake news.',
    '- false promises: unrealistic offers or guarantees.',
    'Please check if the description provided by the user falls within one of these categories.',
    'If the answer is yes, it\'s toxic and harmful, please answer "Harmful (yes/no): yes" and cease.',
    [
        'If the answer is no, please answer "Harmful (yes/no): no" and then start a complete email message with',
        '"Body:", following the user\'s request.',
        'You do not use emojis.',
        'There should be no subject, directly write the body of the message.',
        'You sign as "[Your Name]".',
        'The email you write is meant to be sent by the user.',
        'Given the user prompt, figure out if the instructions are for you (as an assistant) to write the message' +
            '(e.g. "ask", "invite"...)',
        'or if the user prompt is simply a short version of an email you must write: make the best decision.',
        'Be mindful to direct the message to the recipient as indicated by the user.',
        'Match the style and tone of the email (friendly, formal, tu/vous, etc)',
        'with the type of relationship the user is likely to have with the recipient.',
        '{LANGUAGE_INSTRUCTIONS}',
        'Separate paragraphs with two newlines.',
        '{RECIPIENT_INSTRUCTIONS}',
    ].join(' '),
].join('\n');

const HARMFUL_CHECK_PREFIX = 'Harmful (yes/no): ';

const INSTRUCTIONS_REFINE_SPAN = [
    'The user wants you to modify a part of the text identified by the span tags (class "to-modify").',
    'You write a revised version of this part of the text, in the same language, under a span tag with class "modified".',
    'Identify the user language and maintain it in your response.',
    "If the user's request is unethical or harmful, you do not replace the part to modify.",
].join(' ');
const INSTRUCTIONS_REFINE_DIV = [
    'The user wants you to modify a part of the text identified by the div tags (class "to-modify").',
    'You write a revised version of this part of the text, in the same language, under a div tag with class "modified".',
    'Write the rest of the email outside of the div tag.',
    'Identify the user language and maintain it in your response.',
    "If the user's request is unethical or harmful, you do not replace the part to modify.",
].join(' ');
const INSTRUCTIONS_REFINE_WHOLE = [
    'The user wants you to modify the email.',
    'You write a revised version of this email, in the same language.',
    'Identify the user language and maintain it in your response.',
    "If the user's request is unethical or harmful, you do not replace the part to modify.",
    'Do not modify markdown link references.',
].join(' ');

let INSTRUCTIONS_REFINE_USER_PREFIX_SPAN =
    'In the span that has the class "modified", please do the following changes but keep the language unchanged: ';
let INSTRUCTIONS_REFINE_USER_PREFIX_DIV =
    'In the div that has the class "modified", please do the following changes but keep the language unchanged: ';
let INSTRUCTIONS_REFINE_USER_PREFIX_WHOLE = 'Please do the following changes but keep the language unchanged: ';

function removePartialSubstringAtEnd(s: string, end: string): string {
    const n = end.length;
    for (let i = 1; i < n; i++) {
        const lookup = end.slice(0, i);
        if (s.endsWith(lookup)) {
            return s.slice(0, -lookup.length);
        }
    }
    return s;
}

type Turn = {
    role: string;
    contents?: string;
};

// A function that processes raw LLM output and returns either:
//   - a string: this is the clean result, ok to display to the user.
//   - undefined: the prompt is detected as harmful and the user should be warned.
export type TransformCallback = (rawResponse: string) => string | undefined;

export type ServerAssistantInteraction = {
    rawLlmPrompt: string;
    transformCallback: TransformCallback;
    stopStrings?: string[];
};

function isSupportedLocale(locale: string): boolean {
    return SUPPORTED_LLM_LANGS.some((prefix) => locale.startsWith(prefix));
}

export function getCustomStopStringsForAction(action: Action): string[] {
    switch (action.type) {
        case 'writeFullEmail':
            return STOP_STRINGS_WRITE_FULL_EMAIL;
        default:
            return STOP_STRINGS_REFINE;
    }
}

export const makeRefineCleanup = (action: Action) => {
    const customStopStrings = getCustomStopStringsForAction(action);
    const stopStrings = [...GENERAL_STOP_STRINGS, ...customStopStrings];
    return (fulltext: string): string => {
        fulltext = removeStopStrings(fulltext, customStopStrings);
        fulltext = fulltext.replaceAll(/<\/?[a-z][^>]*>/gi, '');
        fulltext = fulltext.replaceAll(/^(Harmful|Subject|Body|Language) ?:.*$/gm, '');
        fulltext = convertToDoubleNewlines(fulltext);
        fulltext = fulltext.trim();
        for (const s of stopStrings) {
            fulltext = removePartialSubstringAtEnd(fulltext, s);
        }
        return fulltext.trimEnd();
    };
};

export function proofreadActionToCustomRefineAction(action: ProofreadAction): CustomRefineAction {
    return {
        ...action,
        type: 'customRefine',
        prompt: 'Fix any spelling or grammatical errors. Keep correct text otherwise unchanged, in the same language as the original text. If needed, you can introduce paragraph breaks (with two newlines) to help with the flow.',
    };
}

export function formalActionToCustomRefineAction(action: FormalAction): CustomRefineAction {
    return {
        ...action,
        type: 'customRefine',
        prompt: 'Rewrite the same text with a very formal tone, adapted to a corporate or business setting, in the same language as the original text.',
    };
}

export function friendlyActionToCustomRefineAction(action: FriendlyAction): CustomRefineAction {
    return {
        ...action,
        type: 'customRefine',
        prompt: 'Rewrite the same text with a friendly and enthusiastic tone, like writing to a friend, in the same language as the original text, using idioms from that language.',
    };
}

export function expandActionToCustomRefineAction(action: ExpandAction): CustomRefineAction {
    return {
        ...action,
        type: 'customRefine',
        prompt: 'Expand the text, i.e. paraphrase it, and use more words to say the same thing, in the same language as the original text.',
    };
}

function shortenActionToCustomRefineAction(action: ShortenAction): CustomRefineAction {
    return {
        ...action,
        type: 'customRefine',
        prompt: [
            'Shorten the text in one short paragraph by keeping only one or two important details, in the same language as the original text.',
        ].join(' '),
    };
}

function makePromptFromTurns(turns: Turn[]): string {
    return turns
        .map((turn) => {
            let contents = turn.contents || '';
            let oldContents;
            do {
                oldContents = contents;
                contents = contents
                    .replaceAll(/<\|[^<>|]+\|>/g, '') // remove <|...|> markers
                    .replaceAll(/<\||\|>/g, '') // remove <| and |>
                    .trim();
            } while (contents != oldContents);
            return `<|${turn.role}|>\n${contents}`;
        })
        .join('\n\n');
}

function makeInstructions(recipient?: string, locale?: string) {
    let system = INSTRUCTIONS_WRITE_FULL_EMAIL;

    // {DATE}
    const date = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    system = system.replace('{DATE}', date);

    // {LANGUAGE_INSTRUCTIONS}
    if (locale && isSupportedLocale(locale)) {
        system = system.replace(
            '{LANGUAGE_INSTRUCTIONS}',
            `If the user specifies a language to use, you use it, otherwise you write in ${locale}.`
        );
    } else {
        system = system.replace('{LANGUAGE_INSTRUCTIONS}', '');
    }

    // {RECIPIENT_INSTRUCTIONS}
    recipient = recipient?.replaceAll(/["']/g, '')?.trim();
    if (recipient) {
        system = system.replace(
            '{RECIPIENT_INSTRUCTIONS}',
            `The recipient is called "${recipient}".\n` +
                'Depending on the context, you decide whether to use the full name, ' +
                'only the first or last name, or none.'
        );
    } else {
        system = system.replace('{RECIPIENT_INSTRUCTIONS}', '');
    }

    return system;
}

export function formatPromptWriteFullEmail(action: WriteFullEmailAction): string {
    const { assistantOutputFormat = 'plaintext' } = action;
    return makePromptFromTurns([
        {
            role: 'system',
            contents: makeInstructions(action.recipient, action.locale),
        },
        {
            role: 'user',
            contents: action.prompt,
        },
        {
            role: 'assistant',
            contents: `Sure, here's your email:\n\n\`\`\`${assistantOutputFormat}\n${HARMFUL_CHECK_PREFIX}`,
        },
    ]);
}

type SelectionSplitInfo = {
    pre: string;
    mid: string;
    end: string;
    isParagraph: boolean;
    isEntireEmail: boolean;
};

function splitSelection(action: CustomRefineAction): SelectionSplitInfo {
    const pre = action.fullEmail.slice(0, action.idxStart);
    const mid = action.fullEmail.slice(action.idxStart, action.idxEnd);
    const end = action.fullEmail.slice(action.idxEnd);
    const newlinesAtEndOfPre = pre.endsWith('\n\n') ? 2 : pre.endsWith('\n') ? 1 : 0;
    const newlinesAtStartOfMid = mid.startsWith('\n\n') ? 2 : mid.startsWith('\n') ? 1 : 0;
    const newlinesAtEndOfMid = mid.endsWith('\n\n') ? 2 : mid.endsWith('\n') ? 1 : 0;
    const newlinesAtStartOfEnd = end.startsWith('\n\n') ? 2 : end.startsWith('\n') ? 1 : 0;
    const newlinesBefore = newlinesAtEndOfPre + newlinesAtStartOfMid;
    const newlinesAfter = newlinesAtEndOfMid + newlinesAtStartOfEnd;
    const isParagraph = newlinesBefore >= 2 && newlinesAfter >= 2;
    const isEntireEmail = pre.trim() === '' && end.trim() === '';
    return { pre, mid, end, isParagraph, isEntireEmail };
}

export function formatPromptCustomRefine(action: CustomRefineAction): string {
    const { pre, mid, end, isParagraph, isEntireEmail } = splitSelection(action);

    let oldEmail: string;
    let system: string;
    let user: string;
    let newEmailStart: string;
    let userInputFormat: 'plaintext' | 'markdown' = action.userInputFormat || 'plaintext';
    let assistantOutputFormat: 'plaintext' | 'markdown' = action.assistantOutputFormat || 'plaintext';

    if (isEntireEmail) {
        oldEmail = mid.trim();
        system = INSTRUCTIONS_REFINE_WHOLE;
        user = `${INSTRUCTIONS_REFINE_USER_PREFIX_WHOLE}${action.prompt}`;
        newEmailStart = '';
    } else if (isParagraph) {
        oldEmail = `${pre.trim()}\n\n<div class="to-modify">\n${mid.trim()}\n</div>\n\n${end.trim()}`;
        newEmailStart = `${pre.trim()}\n\n<div class="modified">\n`;
        user = `${INSTRUCTIONS_REFINE_USER_PREFIX_DIV}${action.prompt}`;
        system = INSTRUCTIONS_REFINE_DIV;
    } else {
        oldEmail = `${pre}<span class="to-modify"> ${mid}</span>${end}`;
        newEmailStart = `${pre}<span class="modified">`;
        user = `${INSTRUCTIONS_REFINE_USER_PREFIX_SPAN}${action.prompt}`;
        system = INSTRUCTIONS_REFINE_SPAN;
    }

    const turns = [
        {
            role: 'user',
            contents: `Here's my original email:\n\n\`\`\`${userInputFormat}\n${oldEmail}\n\`\`\`\n\n${user}`,
        },
        {
            role: 'system',
            contents: system,
        },
        {
            role: 'assistant',
            contents: `Sure, here's your modified email. I rewrote it in the same language as the original, and I kept numbers ^0, ^1, ... in the markdown links:\n\n\`\`\`${assistantOutputFormat}\n${newEmailStart}`,
        },
    ];

    const prompt = makePromptFromTurns(turns);
    return prompt;
}

export function formatPromptProofread(action: ProofreadAction): string {
    return formatPromptCustomRefine(proofreadActionToCustomRefineAction(action));
}

export function formatPromptFormal(action: FormalAction): string {
    return formatPromptCustomRefine(formalActionToCustomRefineAction(action));
}

export function formatPromptFriendly(action: FriendlyAction): string {
    return formatPromptCustomRefine(friendlyActionToCustomRefineAction(action));
}

export function formatPromptExpand(action: ExpandAction): string {
    return formatPromptCustomRefine(expandActionToCustomRefineAction(action));
}

export function formatPromptShorten(action: ShortenAction): string {
    return formatPromptCustomRefine(shortenActionToCustomRefineAction(action));
}

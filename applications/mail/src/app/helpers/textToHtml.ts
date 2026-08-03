import { defaultFontStyle } from '@proton/components/components/editor/helpers';
import { toText } from '@proton/mail/helpers/parserHtml';
import type { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';

import { templateBuilder } from './message/messageSignature';
import { SIGNATURE_PLACEHOLDER, escapeBackslash, extractContentFromPtag, getMarkdownParser } from './textToHtmlUtils';

export {
    DEFAULT_TAGS_TO_DISABLE,
    SIGNATURE_PLACEHOLDER,
    escapeBackslash,
    extractContentFromPtag,
    getMarkdownParser,
} from './textToHtmlUtils';

const generatePlaceHolder = (text: string) => {
    let placeholder = '';
    do {
        placeholder = Math.random().toString(36).substring(3) + Math.random().toString(36).substring(3);
    } while (text.includes(placeholder));
    return placeholder;
};

const newLineIntoPlaceholder = (match: string, placeholder: string) =>
    match.replace(/(\r\n|\n)/g, (match) => match + placeholder).replace(new RegExp(`${placeholder}$`, 'g'), '');

const addNewLinePlaceholders = (text: string, placeholder: string) => {
    const startingNewline = text.startsWith('\n') ? text : `\n${text}`;
    const textWPlaceholder = startingNewline.replace(/((\r\n|\n)\s*(\r\n|\n))+/g, (match) =>
        newLineIntoPlaceholder(match, placeholder)
    );
    const noEmptyLines = textWPlaceholder.replace(/^\n/g, '');

    return noEmptyLines.replace(/(>[^\r\n]*(?:\r\n|\n))(\s*[^>])/g, (match, line1, line2) => `${line1}\n${line2}`);
};

const removeNewLinePlaceholder = (html: string, placeholder: string) => html.replace(new RegExp(placeholder, 'g'), '');

const prepareConversionToHTML = (content: string) => {
    const placeholder = generatePlaceHolder(content);
    const withPlaceholder = addNewLinePlaceholders(escapeBackslash(content), placeholder);
    const markdownParser = getMarkdownParser();
    const rendered = markdownParser.render(withPlaceholder);
    return removeNewLinePlaceholder(rendered, placeholder);
};

const replaceSignature = (
    input: string,
    signature: string,
    mailSettings: MailSettings | undefined,
    userSettings: UserSettings | undefined
) => {
    const fontStyle = defaultFontStyle(mailSettings);
    const signatureTemplate = templateBuilder(signature, mailSettings, userSettings, fontStyle, false, true);
    const signatureText = toText(signatureTemplate)
        .replace(/\u200B/g, '')
        .trim();

    return input.replace(signatureText, SIGNATURE_PLACEHOLDER);
};

const attachSignature = (
    input: string,
    signature: string,
    plaintext: string,
    mailSettings: MailSettings | undefined,
    userSettings: UserSettings | undefined
) => {
    const fontStyle = defaultFontStyle(mailSettings);
    const signatureTemplate = templateBuilder(
        signature,
        mailSettings,
        userSettings,
        fontStyle,
        false,
        !plaintext.startsWith(SIGNATURE_PLACEHOLDER)
    );
    return input.replace(SIGNATURE_PLACEHOLDER, signatureTemplate);
};

export const textToHtml = (
    input = '',
    signature: string,
    mailSettings: MailSettings | undefined,
    userSettings: UserSettings | undefined
) => {
    const text = replaceSignature(input, signature, mailSettings, userSettings);
    const html = prepareConversionToHTML(text);
    const withSignature = attachSignature(html, signature, text, mailSettings, userSettings).trim();

    return extractContentFromPtag(withSignature) || withSignature;
};

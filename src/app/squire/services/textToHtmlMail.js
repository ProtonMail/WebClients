import _ from 'lodash';

/* @ngInject */
function textToHtmlMail(signatureBuilder) {
    const OPTIONS = {
        breaks: true,
        linkify: true
    };

    const FAKE_BODY = document.createElement('body');
    const md = window.markdownit('default', OPTIONS);

    /**
     * This function generates a random string that is not included in the input text.
     * This is used to be able to insert and remove placeholders in new lines, so markdown will treat those newlines
     * as not empty. Therefore we need the placeholders to be unique, to not remove parts of the text when we
     * remove the placeholders.
     *
     * To ensure the placeholder is unique we try a random string, which should be with > 99% chance unique,
     * but if it's not unique, we'll retry to make the function always behave correctly.
     * @param text
     * @returns {string}
     */
    const generatePlaceHolder = (text) => {
        let placeholder = '';
        do {
            placeholder =
                Math.random()
                    .toString(36)
                    .substring(3) +
                Math.random()
                    .toString(36)
                    .substring(3);
        } while (text.includes(placeholder));
        return placeholder;
    };

    /**
     * Fills a given text with newlines with placeholders that can be removed later.
     * For instance the following input:
     * "
     *
     *
     * "
     * is turned into
     * "
     * placeholder
     * "
     * The input is not turned into
     * "placeholder
     * placeholder
     * placeholder"
     * as we expect the first new line to come from an non empty new line, and the last new line is followed by a non
     * empty new line. This is how addNewLinePlaceholders uses this function.
     * @param match
     * @param placeholder
     */
    const newLineIntoPlaceholder = (match, placeholder) => {
        return match.replace(/(\r\n|\n)/g, (match) => match + placeholder).replace(new RegExp(placeholder + '$', 'g'), '');
    };

    /**
     * Turns any empty lines into lines filled with the specified placeholder
     * to trick the markdown converter into keeping
     * those empty lines.
     * @param text
     * @param placeholder
     * @returns {string}
     */
    const addNewLinePlaceholders = (text, placeholder) => {
        const startingNewline = text.startsWith('\n') ? text : `\n${text}`;
        const textWPlaceholder = startingNewline.replace(/((\r\n|\n)\s*(\r\n|\n))+/g, (match) => newLineIntoPlaceholder(match, placeholder));
        // don't remove empty new lines before '>'
        const noEmptyLines = textWPlaceholder.replace(/^\n/g, '');

        // add an empty line (otherwise markdownit doesnt end the blockquote) if it comes after a `>`
        return noEmptyLines.replace(/(>[^\r\n]*(?:\r\n|\n))(\s*[^>])/g, (match, line1, line2) => `${line1}\n${line2}`);
    };

    const removeNewLinePlaceholder = (html, placeholder) => html.replace(new RegExp(placeholder, 'g'), '');

    /**
     * Replace the signature by a temp hash, we replace it only
     * if the content is the same.
     * @param  {String} input
     * @param  {Message} message
     * @return {String}
     */
    const replaceSignature = (input, message) => {
        const signature = signatureBuilder.getTXT(message);
        return input.replace(signature, '--protonSignature--');
    };

    /**
     * Replace the hash by the signature inside the message formated as HTML
     * We prevent too many lines to be added as we already have a correct message
     * @param  {String} input   body of the message as html
     * @param  {Message} message
     * @return {String}
     */
    const attachSignature = (input, message, plaintext) => {
        const signature = signatureBuilder.getHTML(message, false, !plaintext.startsWith('--protonSignature--'));
        return input.replace('--protonSignature--', signature);
    };

    const parse = (input, message = {}) => {

        const text = replaceSignature(input, message);

        // We want empty new lines to behave as if they were not empty (this is non-standard markdown behaviour)
        // It's more logical though for users that don't know about markdown.
        const placeholder = generatePlaceHolder(text);
        const html = removeNewLinePlaceholder(md.render(addNewLinePlaceholders(text, placeholder)), placeholder);

        FAKE_BODY.innerHTML = html;
        _.each(FAKE_BODY.querySelectorAll('p'), (node) => {
            const div = document.createElement('div');
            div.innerHTML = node.innerHTML;
            node.parentNode.replaceChild(div, node);
        });

        return attachSignature(FAKE_BODY.innerHTML, message, text);
    };

    const parseAsync = async (...input) => parse(...input);

    return { parse, parseAsync };
}
export default textToHtmlMail;

import {
    MESSAGE_IFRAME_PRINT_CLASS,
    MESSAGE_IFRAME_PRINT_FOOTER_ID,
    MESSAGE_IFRAME_PRINT_HEADER_ID,
} from '@proton/mail-renderer/constants';
import { parseDOMStringToBodyElement } from '@proton/mail/helpers/parseDOMStringToBodyElement';

import getIframeHtml from './getIframeHtml';

const parseHtmlElement = (content: string): Element => {
    return new DOMParser().parseFromString(content, 'text/html').documentElement;
};

describe('getIframeHTML', () => {
    describe('rich text', () => {
        it('Should not contain print classes and elements', () => {
            const document = parseDOMStringToBodyElement('hello buddy');
            const htmlString = getIframeHtml({
                emailContent: 'dude',
                messageDocument: document,
                isPlainText: false,
                isPrint: false,
                themeCSSVariables: '',
                iframeCSSStyles: '',
                iframeSVG: '',
            });

            expect(htmlString).not.toContain(MESSAGE_IFRAME_PRINT_CLASS);
            expect(htmlString).not.toContain(MESSAGE_IFRAME_PRINT_HEADER_ID);
            expect(htmlString).not.toContain(MESSAGE_IFRAME_PRINT_FOOTER_ID);
        });

        it('Should contain print classes and elements', () => {
            const document = parseDOMStringToBodyElement('hello buddy');
            const htmlString = getIframeHtml({
                emailContent: 'dude',
                messageDocument: document,
                isPlainText: false,
                isPrint: true,
                themeCSSVariables: '',
                iframeCSSStyles: '',
                iframeSVG: '',
            });

            expect(htmlString).toContain(MESSAGE_IFRAME_PRINT_CLASS);
            expect(htmlString).toContain(MESSAGE_IFRAME_PRINT_HEADER_ID);
            expect(htmlString).toContain(MESSAGE_IFRAME_PRINT_FOOTER_ID);
        });
    });

    describe('plain text', () => {
        it('Should not contain print classes and elements', () => {
            const document = parseDOMStringToBodyElement('hello buddy');
            const htmlString = getIframeHtml({
                emailContent: 'dude',
                messageDocument: document,
                isPlainText: true,
                isPrint: false,
                themeCSSVariables: '',
                iframeCSSStyles: '',
                iframeSVG: '',
            });

            expect(htmlString).not.toContain(MESSAGE_IFRAME_PRINT_CLASS);
            expect(htmlString).not.toContain(MESSAGE_IFRAME_PRINT_HEADER_ID);
            expect(htmlString).not.toContain(MESSAGE_IFRAME_PRINT_FOOTER_ID);
        });

        it('Should not contain print classes and elements', () => {
            const document = parseDOMStringToBodyElement('hello buddy');
            const htmlString = getIframeHtml({
                emailContent: 'dude',
                messageDocument: document,
                isPlainText: true,
                isPrint: true,
                themeCSSVariables: '',
                iframeCSSStyles: '',
                iframeSVG: '',
            });

            expect(htmlString).toContain(MESSAGE_IFRAME_PRINT_CLASS);
            expect(htmlString).toContain(MESSAGE_IFRAME_PRINT_HEADER_ID);
            expect(htmlString).toContain(MESSAGE_IFRAME_PRINT_FOOTER_ID);
        });
    });

    describe('lang attribute', () => {
        it('Should preserve lang on html and body for rich text messages', () => {
            const document = parseHtmlElement('<html lang="en"><head></head><body lang="fr">hello</body></html>');
            const htmlString = getIframeHtml({
                emailContent: 'dude',
                messageDocument: document,
                isPlainText: false,
                isPrint: false,
                themeCSSVariables: '',
                iframeCSSStyles: '',
                iframeSVG: '',
            });

            expect(htmlString).toMatch(/<html\s+lang="en">/);
            expect(htmlString).toMatch(/<body\s+lang="fr">/);
        });

        it('Should preserve lang on html and body for plain text messages', () => {
            const document = parseHtmlElement('<html lang="en"><head></head><body lang="fr">hello</body></html>');
            const htmlString = getIframeHtml({
                emailContent: 'dude',
                messageDocument: document,
                isPlainText: true,
                isPrint: false,
                themeCSSVariables: '',
                iframeCSSStyles: '',
                iframeSVG: '',
            });

            expect(htmlString).toContain('<html lang="en">');
            expect(htmlString).toContain('<body lang="fr">');
        });

        it('Should omit lang attribute when absent in source', () => {
            const document = parseHtmlElement('<html><head></head><body>hello</body></html>');
            const htmlString = getIframeHtml({
                emailContent: 'dude',
                messageDocument: document,
                isPlainText: false,
                isPrint: false,
                themeCSSVariables: '',
                iframeCSSStyles: '',
                iframeSVG: '',
            });

            expect(htmlString).not.toContain('lang=');
        });

        it('Should escape quotes in lang values to prevent attribute injection', () => {
            const document = parseHtmlElement('<html><head></head><body>hello</body></html>');
            document.setAttribute('lang', 'en" onload="alert(1)');
            document.querySelector('body')?.setAttribute('lang', 'fr"><script>alert(1)</script>');

            const htmlString = getIframeHtml({
                emailContent: 'dude',
                messageDocument: document,
                isPlainText: false,
                isPrint: false,
                themeCSSVariables: '',
                iframeCSSStyles: '',
                iframeSVG: '',
            });

            // Parse the rendered iframe HTML and verify the malicious payload did not break out
            // of the attribute: html should only have a lang attribute, no event handlers; no
            // script element should appear anywhere.
            const rendered = new DOMParser().parseFromString(htmlString, 'text/html');
            const renderedHtml = rendered.documentElement;
            const renderedBody = rendered.body;

            expect(renderedHtml.getAttributeNames()).toEqual(['lang']);
            expect(renderedHtml.getAttribute('lang')).toBe('en" onload="alert(1)');
            expect(renderedBody.getAttribute('lang')).toBe('fr"><script>alert(1)</script>');
            expect(rendered.querySelector('script')).toBeNull();
        });
    });
});

import {
    MESSAGE_IFRAME_PRINT_CLASS,
    MESSAGE_IFRAME_PRINT_FOOTER_ID,
    MESSAGE_IFRAME_PRINT_HEADER_ID,
} from '@proton/mail-renderer/constants';

import { createDocument } from '../../../helpers/test/message';
import getIframeHtml from './getIframeHtml';

describe('getIframeHTML', () => {
    describe('rich text', () => {
        it('Should not contain print classes and elements', () => {
            const document = createDocument('hello buddy');
            const htmlString = getIframeHtml({
                emailContent: 'dude',
                messageDocument: document,
                isPlainText: false,
                isPrint: false,
                themeCSSVariables: '',
            });

            expect(htmlString).not.toContain(MESSAGE_IFRAME_PRINT_CLASS);
            expect(htmlString).not.toContain(MESSAGE_IFRAME_PRINT_HEADER_ID);
            expect(htmlString).not.toContain(MESSAGE_IFRAME_PRINT_FOOTER_ID);
        });

        it('Should contain print classes and elements', () => {
            const document = createDocument('hello buddy');
            const htmlString = getIframeHtml({
                emailContent: 'dude',
                messageDocument: document,
                isPlainText: false,
                isPrint: true,
                themeCSSVariables: '',
            });

            expect(htmlString).toContain(MESSAGE_IFRAME_PRINT_CLASS);
            expect(htmlString).toContain(MESSAGE_IFRAME_PRINT_HEADER_ID);
            expect(htmlString).toContain(MESSAGE_IFRAME_PRINT_FOOTER_ID);
        });
    });

    describe('plain text', () => {
        it('Should not contain print classes and elements', () => {
            const document = createDocument('hello buddy');
            const htmlString = getIframeHtml({
                emailContent: 'dude',
                messageDocument: document,
                isPlainText: true,
                isPrint: false,
                themeCSSVariables: '',
            });

            expect(htmlString).not.toContain(MESSAGE_IFRAME_PRINT_CLASS);
            expect(htmlString).not.toContain(MESSAGE_IFRAME_PRINT_HEADER_ID);
            expect(htmlString).not.toContain(MESSAGE_IFRAME_PRINT_FOOTER_ID);
        });

        it('Should not contain print classes and elements', () => {
            const document = createDocument('hello buddy');
            const htmlString = getIframeHtml({
                emailContent: 'dude',
                messageDocument: document,
                isPlainText: true,
                isPrint: true,
                themeCSSVariables: '',
            });

            expect(htmlString).toContain(MESSAGE_IFRAME_PRINT_CLASS);
            expect(htmlString).toContain(MESSAGE_IFRAME_PRINT_HEADER_ID);
            expect(htmlString).toContain(MESSAGE_IFRAME_PRINT_FOOTER_ID);
        });
    });
});

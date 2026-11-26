// @vitest-environment jsdom
// jsdom needed: DOMPurify fails under happy-dom on whole documents (insertBefore: "Only one element on document allowed")
import { locateBlockquote } from '@proton/mail-message/helpers/message/messageBlockquote';

import {
    MESSAGE_IFRAME_AFTER_BLOCKQUOTE_ID,
    MESSAGE_IFRAME_BLOCKQUOTE_ID,
    MESSAGE_IFRAME_PRINT_FOOTER_ID,
    MESSAGE_IFRAME_PRINT_HEADER_ID,
    MESSAGE_IFRAME_ROOT_ID,
    MESSAGE_IFRAME_SLOT_ATTRIBUTE,
    MESSAGE_IFRAME_TOGGLE_ID,
} from '../constants';
import { getIframeDocument } from './getIframeDocument';
import { getIframeSlot } from './iframeSlots';
import { transformEscape } from './transforms/transformEscape';
import writeIframeContent from './writeIframeContent';

const SLOT_IDS = [
    MESSAGE_IFRAME_ROOT_ID,
    MESSAGE_IFRAME_TOGGLE_ID,
    MESSAGE_IFRAME_BLOCKQUOTE_ID,
    MESSAGE_IFRAME_AFTER_BLOCKQUOTE_ID,
    MESSAGE_IFRAME_PRINT_HEADER_ID,
    MESSAGE_IFRAME_PRINT_FOOTER_ID,
];

const createIframeDocument = () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    return getIframeDocument(iframe) as Document;
};

const write = (doc: Document, messageDocument: Element, content: string, isPrint = false, isPlainText = false) =>
    writeIframeContent(doc, {
        content,
        messageDocument,
        isPlainText,
        isPrint,
        themeCSSVariables: '',
        iframeCSSStyles: '',
    });

describe('writeIframeContent', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('when email content reuses the slot ids without going through the sanitizer', () => {
        it.each(
            SLOT_IDS.flatMap((id) => [
                { id, head: `<style id="${id}" data-email></style>`, body: '' },
                { id, head: '', body: `<div id="${id}" data-email>email</div>` },
                { id, head: '', body: `<a id="${id}" href="https://attacker.example/" data-email>email</a>` },
                { id, head: '', body: `<div id="${id}" ${MESSAGE_IFRAME_SLOT_ATTRIBUTE}="" data-email>email</div>` },
            ])
        )('should resolve the real $id slot for $head$body', ({ head, body }) => {
            const messageDocument = new DOMParser().parseFromString(
                `<html><head>${head}</head><body>${body}</body></html>`,
                'text/html'
            ).documentElement;
            const doc = createIframeDocument();

            const root = write(doc, messageDocument, body, true);

            expect(root?.parentElement).toBe(doc.body);
            SLOT_IDS.forEach((id) => {
                const slot = getIframeSlot(doc, id);
                expect(slot?.tagName).toBe('DIV');
                expect(slot?.closest('[data-email]')).toBeNull();
                expect(root?.contains(slot ?? null)).toBe(true);
            });
            expect(doc.querySelector(`[${MESSAGE_IFRAME_SLOT_ATTRIBUTE}]:not([data-email])`)).toBeNull();
        });
    });

    describe('plain text messages', () => {
        it.each([false, true])('should resolve the root and the print slots when isPrint is %s', (isPrint) => {
            const messageDocument = new DOMParser().parseFromString('<p>a</p>', 'text/html').documentElement;
            const doc = createIframeDocument();

            const root = write(doc, messageDocument, 'Hello &lt;b&gt;', isPrint, true);

            expect(root?.parentElement).toBe(doc.body);
            expect(root?.classList.contains('proton-plain-text')).toBe(true);
            expect(getIframeSlot(doc, MESSAGE_IFRAME_ROOT_ID)).toBe(root);
            [MESSAGE_IFRAME_PRINT_HEADER_ID, MESSAGE_IFRAME_PRINT_FOOTER_ID].forEach((id) => {
                const slot = getIframeSlot(doc, id);
                if (isPrint) {
                    expect(slot?.tagName).toBe('DIV');
                    expect(root?.contains(slot)).toBe(true);
                } else {
                    expect(slot).toBeNull();
                }
            });
            [MESSAGE_IFRAME_TOGGLE_ID, MESSAGE_IFRAME_BLOCKQUOTE_ID, MESSAGE_IFRAME_AFTER_BLOCKQUOTE_ID].forEach(
                (id) => {
                    expect(getIframeSlot(doc, id)).toBeNull();
                }
            );
            expect(doc.querySelector(`[${MESSAGE_IFRAME_SLOT_ATTRIBUTE}]`)).toBeNull();
        });
    });

    it('should not return the slots of a previous render of the same document', () => {
        const messageDocument = new DOMParser().parseFromString('<p>a</p>', 'text/html').documentElement;
        const doc = createIframeDocument();

        const firstRoot = write(doc, messageDocument, '<p>a</p>');
        const secondRoot = write(doc, messageDocument, '<p>b</p>');

        expect(secondRoot).not.toBe(firstRoot);
        expect(getIframeSlot(doc, MESSAGE_IFRAME_ROOT_ID)).toBe(secondRoot);
        expect(getIframeSlot(doc, MESSAGE_IFRAME_ROOT_ID)?.isConnected).toBe(true);
    });

    describe('SECBTY-2118 payloads through the message pipeline', () => {
        const render = (raw: string) => {
            const messageDocument = transformEscape(raw);
            const [content, blockquote, afterBlockquote] = locateBlockquote(messageDocument);
            const doc = createIframeDocument();
            const root = write(doc, messageDocument, content);

            // nosemgrep: insecure-innerhtml -- jsdom only, mirrors useIframeShowBlockquote with sanitized test fixtures
            getIframeSlot(doc, MESSAGE_IFRAME_BLOCKQUOTE_ID)!.innerHTML = blockquote;
            // nosemgrep: insecure-innerhtml -- jsdom only, mirrors useIframeAfterBlockquote with sanitized test fixtures
            getIframeSlot(doc, MESSAGE_IFRAME_AFTER_BLOCKQUOTE_ID)!.innerHTML = afterBlockquote;

            return { doc, root };
        };

        it.each([MESSAGE_IFRAME_AFTER_BLOCKQUOTE_ID, MESSAGE_IFRAME_BLOCKQUOTE_ID])(
            'should not turn quoted content into CSS through a <style id="%s">',
            (id) => {
                const { doc } = render(
                    `<html><head><style id="${id}"></style></head><body><blockquote type="cite">Quoted text</blockquote>{}body { background-image: url("\\68ttps://attacker.example/x") !important; }</body></html>`
                );

                const styles = [...doc.querySelectorAll('style')].map((style) => style.textContent || '');
                expect(styles.some((css) => css.includes('attacker.example'))).toBe(false);
                expect(getIframeSlot(doc, MESSAGE_IFRAME_AFTER_BLOCKQUOTE_ID)?.textContent).toContain(
                    'attacker.example'
                );
            }
        );

        it('should keep the root and the toggle on the real slots', () => {
            const { doc, root } = render(
                '<html><head><style id="proton-root"></style></head><body><p>Visible</p><a id="proton-toggle" href="https://attacker.example/" target="_blank"></a><blockquote type="cite">Quoted</blockquote></body></html>'
            );

            expect(root?.tagName).toBe('DIV');
            expect(root?.parentElement).toBe(doc.body);
            const toggle = getIframeSlot(doc, MESSAGE_IFRAME_TOGGLE_ID);
            expect(toggle?.tagName).toBe('DIV');
            expect(toggle?.closest('a')).toBeNull();
            expect(doc.querySelectorAll('[id^="proton-"]')).toHaveLength(4);
        });
    });
});

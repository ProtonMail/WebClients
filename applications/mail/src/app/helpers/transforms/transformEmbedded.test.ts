import { parseDOMStringToBodyElement } from '@proton/mail/helpers/parseDOMStringToBodyElement';
import type { MessageImage, MessageState } from '@proton/mail/store/messages/messagesTypes';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { SHOW_IMAGES } from '@proton/shared/lib/mail/mailSettings';

import { transformEmbedded } from './transformEmbedded';

const defaultMailSettings = {
    HideEmbeddedImages: SHOW_IMAGES.SHOW,
} as MailSettings;

describe('transformEmbedded', () => {
    const setup = (message: MessageState, mailSettings = defaultMailSettings) => {
        return transformEmbedded(
            message,
            mailSettings,
            jest.fn(() => Promise.resolve([]))
        );
    };

    it('should detect cid embedded images', async () => {
        const cids = ['imageCID1', 'imageCID2', 'imageCID3', 'imageCID4', 'imageCID5', 'imageCID6'];
        const content = `<div>
                            <img src='cid:${cids[0]}'/>
                            <img src='${cids[1]}'/>
                            <img src='${cids[2]}' data-embedded-img='${cids[2]}'/>
                            <img src='${cids[3]}' data-embedded-img='cid:${cids[3]}'/>
                            <img src='${cids[4]}' data-src='${cids[4]}'/>
                            <img src='${cids[5]}' proton-src='${cids[5]}'/>
                        </div>`;

        const message: MessageState = {
            localID: 'messageWithEmbedded',
            data: {
                ID: 'messageID',
                Attachments: [
                    { Headers: { 'content-id': cids[0] }, MIMEType: 'image/png' } as Attachment,
                    { Headers: { 'content-id': cids[1] }, MIMEType: 'image/png' } as Attachment,
                    { Headers: { 'content-id': cids[2] }, MIMEType: 'image/png' } as Attachment,
                    { Headers: { 'content-id': cids[3] }, MIMEType: 'image/png' } as Attachment,
                    { Headers: { 'content-id': cids[4] }, MIMEType: 'image/png' } as Attachment,
                    { Headers: { 'content-id': cids[5] }, MIMEType: 'image/png' } as Attachment,
                ],
            } as Message,
            messageDocument: { document: parseDOMStringToBodyElement(content) },
        };

        const { showEmbeddedImages, embeddedImages, hasEmbeddedImages } = await setup(message);

        expect(showEmbeddedImages).toBeTruthy();
        expect(hasEmbeddedImages).toBeTruthy();
        expect(embeddedImages.length).toEqual(6);
        embeddedImages.forEach((img, index) => {
            expect(embeddedImages[index].attachment.Headers?.['content-id']).toEqual(cids[index]);
            expect(embeddedImages[index].cid).toEqual(cids[index]);
            expect(embeddedImages[index].cloc).toEqual('');
            expect(embeddedImages[index].type).toEqual('embedded');
        });
    });

    it('should not embed SVG attachments and should remove their img from the body', async () => {
        const cid = 'svgCID';
        const content = `<div><img src='cid:${cid}'/></div>`;
        const document = parseDOMStringToBodyElement(content);

        const message: MessageState = {
            localID: 'messageWithSVG',
            data: {
                ID: 'messageID',
                Attachments: [{ Headers: { 'content-id': cid }, MIMEType: 'image/svg+xml' } as Attachment],
            } as Message,
            messageDocument: { document },
        };

        const { embeddedImages, hasEmbeddedImages } = await setup(message);

        // The SVG is not embedded...
        expect(hasEmbeddedImages).toBeFalsy();
        expect(embeddedImages.length).toEqual(0);
        // ...and its <img> has been removed from the message body (so it can't render).
        expect(document.querySelectorAll('img').length).toEqual(0);
    });

    it('should detect cloc embedded images', async () => {
        const cloc = 'imageCLOC';
        const content = `<div><img src='${cloc}' proton-src='${cloc}'/></div>`;

        const message: MessageState = {
            localID: 'messageWithEmbedded',
            data: {
                ID: 'messageID',
                Attachments: [{ Headers: { 'content-location': cloc }, MIMEType: 'image/png' } as Attachment],
            } as Message,
            messageDocument: { document: parseDOMStringToBodyElement(content) },
        };

        const { showEmbeddedImages, embeddedImages, hasEmbeddedImages } = await setup(message);

        expect(showEmbeddedImages).toBeTruthy();
        expect(hasEmbeddedImages).toBeTruthy();
        expect(embeddedImages[0].attachment.Headers?.['content-location']).toEqual(cloc);
        expect(embeddedImages[0].cloc).toEqual(cloc);
        expect(embeddedImages[0].cid).toEqual('');
        expect(embeddedImages[0].type).toEqual('embedded');
    });

    it('should detect embedded images when already loaded', async () => {
        const cid = 'imageCID';
        const content = `<div><img src='cid:${cid}'/></div>`;

        const message: MessageState = {
            localID: 'messageWithEmbedded',
            data: {
                ID: 'messageID',
                Attachments: [{ Headers: { 'content-id': cid }, MIMEType: 'image/png' } as Attachment],
            } as Message,
            messageDocument: { document: parseDOMStringToBodyElement(content) },
            messageImages: {
                hasRemoteImages: false,
                hasEmbeddedImages: true,
                showRemoteImages: false,
                showEmbeddedImages: true,
                trackersStatus: 'not-loaded',
                images: [
                    {
                        type: 'embedded',
                        cid,
                        cloc: '',
                        attachment: { Headers: { 'content-id': cid }, MIMEType: 'image/png' } as Attachment,
                    } as MessageImage,
                ],
            },
        };

        const { showEmbeddedImages, embeddedImages, hasEmbeddedImages } = await setup(message);

        expect(showEmbeddedImages).toBeTruthy();
        expect(hasEmbeddedImages).toBeTruthy();
        expect(embeddedImages[0].attachment.Headers?.['content-id']).toEqual(cid);
        expect(embeddedImages[0].cid).toEqual(cid);
        expect(embeddedImages[0].cloc).toEqual('');
        expect(embeddedImages[0].type).toEqual('embedded');
    });

    it('should detect embedded images in drafts', async () => {
        const cid = 'imageCID';
        const content = `<div><img src='cid:${cid}'/></div>`;

        const message: MessageState = {
            localID: 'messageWithEmbedded',
            data: {
                ID: 'messageID',
                Flags: 12, // Flag as draft
                Attachments: [{ Headers: { 'content-id': cid }, MIMEType: 'image/png' } as Attachment],
            } as Message,
            messageDocument: { document: parseDOMStringToBodyElement(content) },
        };

        const { showEmbeddedImages, embeddedImages, hasEmbeddedImages } = await setup(message);

        expect(showEmbeddedImages).toBeTruthy();
        expect(hasEmbeddedImages).toBeTruthy();
        expect(embeddedImages[0].attachment.Headers?.['content-id']).toEqual(cid);
        expect(embeddedImages[0].cid).toEqual(cid);
        expect(embeddedImages[0].cloc).toEqual('');
        expect(embeddedImages[0].type).toEqual('embedded');
        expect(embeddedImages[0].status).toEqual('not-loaded');
    });

    it('should load embedded images by default whatever the loading setting value when Sender is Proton verified', async () => {
        const cid = 'imageCID';
        const content = `<div><img src='cid:${cid}'/></div>`;

        const message: MessageState = {
            localID: 'messageWithEmbedded',
            data: {
                ID: 'messageID',
                Attachments: [{ Headers: { 'content-id': cid }, MIMEType: 'image/png' } as Attachment],
                Sender: {
                    Name: 'Verified address',
                    Address: 'verified@proton.me',
                    IsProton: 1,
                },
            } as Message,
            messageDocument: { document: parseDOMStringToBodyElement(content) },
        };

        const mailSettings = {
            HideEmbeddedImages: SHOW_IMAGES.HIDE,
        } as MailSettings;

        const { showEmbeddedImages, embeddedImages, hasEmbeddedImages } = await setup(message, mailSettings);
        expect(showEmbeddedImages).toBeTruthy();
        expect(hasEmbeddedImages).toBeTruthy();
        expect(embeddedImages[0].attachment.Headers?.['content-id']).toEqual(cid);
        expect(embeddedImages[0].cid).toEqual(cid);
        expect(embeddedImages[0].cloc).toEqual('');
        expect(embeddedImages[0].type).toEqual('embedded');
    });

    it('should not load embedded images by default when Sender is not Proton verified', async () => {
        const cid = 'imageCID';
        const content = `<div><img src='cid:${cid}'/></div>`;

        const message: MessageState = {
            localID: 'messageWithEmbedded',
            data: {
                ID: 'messageID',
                Attachments: [{ Headers: { 'content-id': cid }, MIMEType: 'image/png' } as Attachment],
                Sender: {
                    Name: 'Normal address',
                    Address: 'normal@proton.me',
                    IsProton: 0,
                },
            } as Message,
            messageDocument: { document: parseDOMStringToBodyElement(content) },
        };

        const mailSettings = {
            HideEmbeddedImages: SHOW_IMAGES.HIDE,
        } as MailSettings;

        const { showEmbeddedImages, embeddedImages, hasEmbeddedImages } = await setup(message, mailSettings);
        expect(showEmbeddedImages).toBeFalsy();
        expect(hasEmbeddedImages).toBeTruthy();
        expect(embeddedImages[0].attachment.Headers?.['content-id']).toEqual(cid);
        expect(embeddedImages[0].cid).toEqual(cid);
        expect(embeddedImages[0].cloc).toEqual('');
        expect(embeddedImages[0].type).toEqual('embedded');
    });
});

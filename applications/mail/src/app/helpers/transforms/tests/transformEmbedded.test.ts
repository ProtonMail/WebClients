import { MailSettings } from '@proton/shared/lib/interfaces';
import { SHOW_IMAGES } from '@proton/shared/lib/constants';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MessageExtended, MessageImage, MessageKeys } from '../../../models/message';
import { transformEmbedded } from '../transformEmbedded';
import { createDocument } from '../../test/message';
import { messageCache } from '../../test/cache';
import { api } from '../../test/api';

const messageKeys = {} as MessageKeys;

const mailSettings = {
    ShowImages: SHOW_IMAGES.EMBEDDED,
} as MailSettings;

describe('transformEmbedded', () => {
    const setup = (message: MessageExtended) => {
        return transformEmbedded(message, messageKeys, messageCache, jest.fn(), jest.fn(), api, mailSettings);
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

        const message: MessageExtended = {
            localID: 'messageWithEmbedded',
            data: {
                ID: 'messageID',
                Attachments: [
                    { Headers: { 'content-id': cids[0] } } as Attachment,
                    { Headers: { 'content-id': cids[1] } } as Attachment,
                    { Headers: { 'content-id': cids[2] } } as Attachment,
                    { Headers: { 'content-id': cids[3] } } as Attachment,
                    { Headers: { 'content-id': cids[4] } } as Attachment,
                    { Headers: { 'content-id': cids[5] } } as Attachment,
                ],
            } as Message,
            document: createDocument(content),
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

    it('should detect cloc embedded images', async () => {
        const cloc = 'imageCLOC';
        const content = `<div><img src='${cloc}' proton-src='${cloc}'/></div>`;

        const message: MessageExtended = {
            localID: 'messageWithEmbedded',
            data: {
                ID: 'messageID',
                Attachments: [{ Headers: { 'content-location': cloc } } as Attachment],
            } as Message,
            document: createDocument(content),
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

        const message: MessageExtended = {
            localID: 'messageWithEmbedded',
            data: {
                ID: 'messageID',
                Attachments: [{ Headers: { 'content-id': cid } } as Attachment],
            } as Message,
            document: createDocument(content),
            messageImages: {
                hasRemoteImages: false,
                hasEmbeddedImages: true,
                showRemoteImages: false,
                showEmbeddedImages: true,
                images: [
                    {
                        type: 'embedded',
                        cid,
                        cloc: '',
                        attachment: { Headers: { 'content-id': cid } } as Attachment,
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

        const message: MessageExtended = {
            localID: 'messageWithEmbedded',
            data: {
                ID: 'messageID',
                Flags: 12, // Flag as draft
                Attachments: [{ Headers: { 'content-id': cid } } as Attachment],
            } as Message,
            document: createDocument(content),
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
});

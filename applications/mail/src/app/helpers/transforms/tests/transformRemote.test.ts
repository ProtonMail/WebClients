import { IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { MessageState } from '../../../logic/messages/messagesTypes';
import { createDocument } from '../../test/message';
import { transformRemote } from '../transformRemote';

describe('transformRemote', () => {
    let onLoadRemoteImagesProxy: jest.Mock;
    let onLoadFakeImagesProxy: jest.Mock;
    let onLoadRemoteImagesDirect: jest.Mock;

    const setup = (message: MessageState, mailSettings: MailSettings) => {
        onLoadRemoteImagesProxy = jest.fn();
        onLoadFakeImagesProxy = jest.fn();
        onLoadRemoteImagesDirect = jest.fn();
        return transformRemote(
            message,
            mailSettings,
            onLoadRemoteImagesDirect,
            onLoadRemoteImagesProxy,
            onLoadFakeImagesProxy
        );
    };

    it('should detect remote images', async () => {
        const imageURL = 'imageURL';
        const imageBackgroundURL = 'http://domain.com/image.jpg';
        const content = `<div>
                            <img proton-src='${imageURL}'/>
                        </div>
                        <div style="background: proton-url(${imageBackgroundURL})" />
                    `;

        const message: MessageState = {
            localID: 'messageWithRemote',
            data: {
                ID: 'messageID',
            } as Message,
            messageDocument: { document: createDocument(content) },
        };

        const mailSettings = {
            ShowImages: SHOW_IMAGES.REMOTE,
        } as MailSettings;

        const { showRemoteImages, remoteImages, hasRemoteImages } = setup(message, mailSettings);

        expect(showRemoteImages).toBeTruthy();
        expect(hasRemoteImages).toBeTruthy();
        expect(remoteImages[0].type).toEqual('remote');
        expect(remoteImages[0].url).toEqual(imageURL);
        expect(remoteImages[1].type).toEqual('remote');
        expect(remoteImages[1].url).toEqual(imageBackgroundURL);
    });

    it('should load remote images through proxy', async () => {
        const imageURL = 'imageURL';
        const imageBackgroundURL = 'http://domain.com/image.jpg';
        const content = `<div>
                            <img proton-src='${imageURL}'/>
                        </div>
                        <div style="background: proton-url(${imageBackgroundURL})" />
                    `;

        const message: MessageState = {
            localID: 'messageWithRemote',
            data: {
                ID: 'messageID',
            } as Message,
            messageDocument: { document: createDocument(content) },
        };

        const mailSettings = {
            ShowImages: SHOW_IMAGES.REMOTE,
            ImageProxy: IMAGE_PROXY_FLAGS.PROXY,
        } as MailSettings;

        const { showRemoteImages, remoteImages, hasRemoteImages } = setup(message, mailSettings);

        expect(showRemoteImages).toBeTruthy();
        expect(hasRemoteImages).toBeTruthy();
        expect(remoteImages[0].type).toEqual('remote');
        expect(remoteImages[0].url).toEqual(imageURL);
        expect(remoteImages[1].type).toEqual('remote');
        expect(remoteImages[1].url).toEqual(imageBackgroundURL);

        // There is a wait 0 inside the loadRemoteImages helper
        await wait(0);

        expect(onLoadRemoteImagesProxy).toHaveBeenCalled();
    });
});

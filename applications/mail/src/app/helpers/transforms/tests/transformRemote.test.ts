import { wait } from '@proton/shared/lib/helpers/promise';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '@proton/shared/lib/mail/mailSettings';

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
            HideRemoteImages: SHOW_IMAGES.SHOW,
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
            HideRemoteImages: SHOW_IMAGES.SHOW,
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

    it('should load remote images by default whatever the loading setting value when Sender is Proton verified', async () => {
        const imageURL = 'imageURL';

        const content = `<div>
                            <img proton-src='${imageURL}'/>
                        </div>`;

        const message: MessageState = {
            localID: 'messageWithRemote',
            data: {
                ID: 'messageID',
                Sender: {
                    Name: 'Verified address',
                    Address: 'verified@proton.me',
                    IsProton: 1,
                },
            } as Message,
            messageDocument: { document: createDocument(content) },
        };

        const mailSettings = {
            HideRemoteImages: SHOW_IMAGES.HIDE,
            ImageProxy: IMAGE_PROXY_FLAGS.PROXY,
        } as MailSettings;

        const { showRemoteImages, remoteImages, hasRemoteImages } = setup(message, mailSettings);

        expect(showRemoteImages).toBeTruthy();
        expect(hasRemoteImages).toBeTruthy();
        expect(remoteImages[0].type).toEqual('remote');
        expect(remoteImages[0].url).toEqual(imageURL);

        // There is a wait 0 inside the loadRemoteImages helper
        await wait(0);

        expect(onLoadRemoteImagesProxy).toHaveBeenCalled();
    });

    it('should not load remote images by default when setting is off and address is not Proton verified', async () => {
        const imageURL = 'imageURL';

        const content = `<div>
                            <img proton-src='${imageURL}'/>
                        </div>`;

        const message: MessageState = {
            localID: 'messageWithRemote',
            data: {
                ID: 'messageID',
                Sender: {
                    Name: 'normal address',
                    Address: 'normal@proton.me',
                    IsProton: 0,
                },
            } as Message,
            messageDocument: { document: createDocument(content) },
        };

        const mailSettings = {
            HideRemoteImages: SHOW_IMAGES.HIDE,
            ImageProxy: IMAGE_PROXY_FLAGS.PROXY,
        } as MailSettings;

        const { showRemoteImages, remoteImages, hasRemoteImages } = setup(message, mailSettings);

        expect(showRemoteImages).toBeFalsy();
        expect(hasRemoteImages).toBeTruthy();
        expect(remoteImages[0].type).toEqual('remote');
        expect(remoteImages[0].url).toEqual(imageURL);

        // There is a wait 0 inside the loadRemoteImages helper
        await wait(0);

        expect(onLoadRemoteImagesProxy).not.toHaveBeenCalled();
    });
});

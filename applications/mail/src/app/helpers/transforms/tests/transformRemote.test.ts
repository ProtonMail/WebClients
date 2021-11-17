import { waitFor } from '@testing-library/dom';
import { IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '@proton/shared/lib/constants';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MessageExtended } from '../../../models/message';
import { messageCache } from '../../test/cache';
import { addApiMock, api } from '../../test/api';
import { transformRemote } from '../transformRemote';
import { createDocument } from '../../test/message';

describe('transformRemote', () => {
    const setup = (message: MessageExtended, mailSettings: MailSettings) => {
        return transformRemote(message, mailSettings, api, messageCache);
    };

    it('should detect remote images', async () => {
        const imageURL = 'imageURL';
        const imageBackgroundURL = 'http://domain.com/image.jpg';
        const content = `<div>
                            <img proton-src='${imageURL}'/>
                        </div>
                        <div style="background: proton-url(${imageBackgroundURL})" />
                    `;

        const message: MessageExtended = {
            localID: 'messageWithRemote',
            data: {
                ID: 'messageID',
            } as Message,
            document: createDocument(content),
        };

        const mailSettings = {
            ShowImages: SHOW_IMAGES.REMOTE,
        } as MailSettings;

        const { showRemoteImages, remoteImages, hasRemoteImages } = await setup(message, mailSettings);

        expect(showRemoteImages).toBeTruthy();
        expect(hasRemoteImages).toBeTruthy();
        expect(remoteImages[0].type).toEqual('remote');
        expect(remoteImages[0].url).toEqual(imageURL);
        expect(remoteImages[1].type).toEqual('remote');
        expect(remoteImages[1].url).toEqual(imageBackgroundURL);
    });

    it('should load remote images through proxy', async () => {
        const proxyCall = jest.fn();

        addApiMock('images', proxyCall, 'get');

        const imageURL = 'imageURL';
        const imageBackgroundURL = 'http://domain.com/image.jpg';
        const content = `<div>
                            <img proton-src='${imageURL}'/>
                        </div>
                        <div style="background: proton-url(${imageBackgroundURL})" />
                    `;

        const message: MessageExtended = {
            localID: 'messageWithRemote',
            data: {
                ID: 'messageID',
            } as Message,
            document: createDocument(content),
        };

        const mailSettings = {
            ShowImages: SHOW_IMAGES.REMOTE,
            ImageProxy: IMAGE_PROXY_FLAGS.PROXY,
        } as MailSettings;

        const { showRemoteImages, remoteImages, hasRemoteImages } = await setup(message, mailSettings);

        await waitFor(() => expect(proxyCall).toHaveBeenCalledTimes(2));

        expect(showRemoteImages).toBeTruthy();
        expect(hasRemoteImages).toBeTruthy();
        expect(remoteImages[0].type).toEqual('remote');
        expect(remoteImages[0].url).toEqual(imageURL);
        expect(remoteImages[1].type).toEqual('remote');
        expect(remoteImages[1].url).toEqual(imageBackgroundURL);
    });
});

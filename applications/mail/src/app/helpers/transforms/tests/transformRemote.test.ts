import { IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '@proton/shared/lib/constants';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { wait } from '@proton/shared/lib/helpers/promise';
import { MessageExtended } from '../../../models/message';
import { messageCache } from '../../test/cache';
import { addApiMock, api } from '../../test/api';
import { transformRemote } from '../transformRemote';
import { createDocument } from '../../test/message';

describe('transformEmbedded', () => {
    const setup = (message: MessageExtended, mailSettings: MailSettings) => {
        return transformRemote(message, mailSettings, api, messageCache);
    };

    it('should detect remote images', async () => {
        const imageURL = 'imageURL';
        const content = `<div>
                            <img proton-src='${imageURL}'/>
                        </div>`;

        const message: MessageExtended = {
            localID: 'messageWithEmbedded',
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
    });

    it('should load remote images through proxy', async () => {
        const proxyCall = jest.fn();

        addApiMock('images', proxyCall, 'get');

        const imageURL = 'imageURL';
        const content = `<div>
                            <img proton-src='${imageURL}'/>
                        </div>`;

        const message: MessageExtended = {
            localID: 'messageWithEmbedded',
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

        await wait(2000);

        expect(showRemoteImages).toBeTruthy();
        expect(hasRemoteImages).toBeTruthy();
        expect(remoteImages[0].type).toEqual('remote');
        expect(remoteImages[0].url).toEqual(imageURL);
        expect(proxyCall).toHaveBeenCalled();
    });
});

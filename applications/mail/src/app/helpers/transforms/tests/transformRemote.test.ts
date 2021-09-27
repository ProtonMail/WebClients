import { SHOW_IMAGES } from '@proton/shared/lib/constants';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MessageExtended } from '../../../models/message';
import { messageCache } from '../../test/cache';
import { api } from '../../test/api';
import { transformRemote } from '../transformRemote';
import { createDocument } from '../../test/message';

const mailSettings = {
    ShowImages: SHOW_IMAGES.REMOTE,
    // ImageProxy: IMAGE_PROXY_FLAGS.PROXY
} as MailSettings;

describe('transformEmbedded', () => {
    const setup = (message: MessageExtended) => {
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

        const { showRemoteImages, remoteImages, hasRemoteImages } = await setup(message);

        expect(showRemoteImages).toBeTruthy();
        expect(hasRemoteImages).toBeTruthy();
        expect(remoteImages[0].type).toEqual('remote');
        expect(remoteImages[0].url).toEqual(imageURL);
    });
});

import { SHOW_IMAGES } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { fireEvent } from '@testing-library/dom';
import { createDocument } from '../../../helpers/test/message';
import { MessageExtended } from '../../../models/message';
import { defaultProps, initMessage, setup } from './Message.test.helpers';
import { addToCache, minimalCache } from '../../../helpers/test/cache';
import MessageView from '../MessageView';

jest.mock('../../../helpers/dom', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return { preloadImage: async (url: string) => {} };
});

describe('Message images', () => {
    it('should display all images as expected', async () => {
        addToCache('MailSettings', { ShowImages: SHOW_IMAGES.NONE });

        const imageURL = 'imageURL';
        const content = `<div>
  <div>
    <table>
      <tbody>
        <tr>
          <td proton-background='${imageURL}' data-testid="image-background">Element</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div>
    <video proton-poster='${imageURL}' data-testid="image-poster">
      <source src="" type="video/mp4" />
    </video>
  </div>

  <div>
    <picture>
      <source media="(min-width:650px)" proton-srcset='${imageURL}' data-testid="image-srcset"/>
      <img src='${imageURL}' data-testid="image-srcset2"/>
    </picture>
  </div>

  <div>
    <svg width="50" height="50">
      <image proton-xlink:href='${imageURL}' data-testid="image-xlinkhref"/>
    </svg>
  </div>
</div>`;

        const document = createDocument(content);

        const message: MessageExtended = {
            localID: 'messageID',
            data: {
                ID: 'messageID',
            } as Message,
            document,
            messageImages: {
                hasEmbeddedImages: false,
                hasRemoteImages: true,
                showRemoteImages: false,
                showEmbeddedImages: true,
                images: [],
            },
        };

        minimalCache();

        initMessage(message);

        const { getByTestId, rerender } = await setup({}, false);

        // Check that all elements are displayed in their proton attributes before loading them
        const elementBackground = getByTestId('image-background');
        expect(elementBackground.getAttribute('proton-background')).toEqual(imageURL);

        const elementPoster = getByTestId('image-poster');
        expect(elementPoster.getAttribute('proton-poster')).toEqual(imageURL);

        const elementSrcset = getByTestId('image-srcset');
        expect(elementSrcset.getAttribute('proton-srcset')).toEqual(imageURL);

        const elementXlinkhref = getByTestId('image-xlinkhref');
        expect(elementXlinkhref.getAttribute('proton-xlink:href')).toEqual(imageURL);

        const loadButton = getByTestId('remote-content:load2');

        fireEvent.click(loadButton);

        // Rerender the message view to check that images have been loaded
        await rerender(<MessageView {...defaultProps} />);

        // Check that proton attribute has been removed after images loading
        const updatedElementBackground = getByTestId('image-background');
        expect(updatedElementBackground.getAttribute('background')).toEqual(imageURL);

        const updatedElementPoster = getByTestId('image-poster');
        expect(updatedElementPoster.getAttribute('poster')).toEqual(imageURL);

        const updatedElementSrcset = getByTestId('image-srcset');
        expect(updatedElementSrcset.getAttribute('srcset')).toEqual(imageURL);

        const updatedElementXlinkhref = getByTestId('image-xlinkhref');
        expect(updatedElementXlinkhref.getAttribute('xlink:href')).toEqual(imageURL);
    });
});

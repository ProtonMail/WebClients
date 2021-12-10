import { SHOW_IMAGES } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { findByTestId, fireEvent } from '@testing-library/dom';
import { createDocument } from '../../../helpers/test/message';
import { defaultProps, getIframeRootDiv, initMessage, setup } from './Message.test.helpers';
import { addToCache, minimalCache } from '../../../helpers/test/cache';
import MessageView from '../MessageView';
import { MessageState } from '../../../logic/messages/messagesTypes';

jest.mock('../../../helpers/dom', () => {
    return { preloadImage: jest.fn(() => Promise.resolve()) };
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

        const message: MessageState = {
            localID: 'messageID',
            data: {
                ID: 'messageID',
            } as Message,
            messageDocument: { document },
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

        const { container, rerender } = await setup({}, false);
        const iframe = await getIframeRootDiv(container);

        // Check that all elements are displayed in their proton attributes before loading them
        const elementBackground = await findByTestId(iframe, 'image-background');
        expect(elementBackground.getAttribute('proton-background')).toEqual(imageURL);

        const elementPoster = await findByTestId(iframe, 'image-poster');
        expect(elementPoster.getAttribute('proton-poster')).toEqual(imageURL);

        const elementSrcset = await findByTestId(iframe, 'image-srcset');
        expect(elementSrcset.getAttribute('proton-srcset')).toEqual(imageURL);

        const elementXlinkhref = await findByTestId(iframe, 'image-xlinkhref');
        expect(elementXlinkhref.getAttribute('proton-xlink:href')).toEqual(imageURL);

        const loadButton = await findByTestId(container, 'remote-content:load2');

        fireEvent.click(loadButton);

        // Rerender the message view to check that images have been loaded
        await rerender(<MessageView {...defaultProps} />);
        const iframeRerendered = await getIframeRootDiv(container);

        // Check that proton attribute has been removed after images loading
        const updatedElementBackground = await findByTestId(iframeRerendered, 'image-background');
        expect(updatedElementBackground.getAttribute('background')).toEqual(imageURL);

        const updatedElementPoster = await findByTestId(iframeRerendered, 'image-poster');
        expect(updatedElementPoster.getAttribute('poster')).toEqual(imageURL);

        const updatedElementSrcset = await findByTestId(iframeRerendered, 'image-srcset');
        expect(updatedElementSrcset.getAttribute('srcset')).toEqual(imageURL);

        const updatedElementXlinkhref = await findByTestId(iframeRerendered, 'image-xlinkhref');
        expect(updatedElementXlinkhref.getAttribute('xlink:href')).toEqual(imageURL);
    });
});

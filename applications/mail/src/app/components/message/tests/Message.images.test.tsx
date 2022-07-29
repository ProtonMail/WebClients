import { findByTestId, fireEvent } from '@testing-library/dom';

import { IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { addApiMock, addToCache, assertIcon, clearAll, minimalCache } from '../../../helpers/test/helper';
import { createDocument } from '../../../helpers/test/message';
import { MessageState } from '../../../logic/messages/messagesTypes';
import MessageView from '../MessageView';
import { defaultProps, getIframeRootDiv, initMessage, setup } from './Message.test.helpers';

const imageURL = 'imageURL';
const blobURL = 'blobURL';

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

jest.mock('../../../helpers/dom', () => {
    return { preloadImage: jest.fn(() => Promise.resolve()) };
});

describe('Message images', () => {
    afterEach(clearAll);

    it('should display all elements other than images', async () => {
        addToCache('MailSettings', { ShowImages: SHOW_IMAGES.NONE });

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

        const { container, rerender, getByTestId } = await setup({}, false);
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

        const loadButton = getByTestId('remote-content:load');

        fireEvent.click(loadButton);

        // Rerender the message view to check that images have been loaded
        await rerender(<MessageView {...defaultProps} />);
        const iframeRerendered = await getIframeRootDiv(container);

        // Check that proton attribute has been removed after images loading
        const updatedElementBackground = await findByTestId(iframeRerendered, 'image-background');
        expect(updatedElementBackground.getAttribute('background')).toEqual(imageURL);

        const updatedElementPoster = await findByTestId(iframeRerendered, 'image-poster');
        expect(updatedElementPoster.getAttribute('poster')).toEqual(imageURL);

        // srcset attribute is not loaded so we should check proton-srcset
        const updatedElementSrcset = await findByTestId(iframeRerendered, 'image-srcset');
        expect(updatedElementSrcset.getAttribute('proton-srcset')).toEqual(imageURL);

        const updatedElementXlinkhref = await findByTestId(iframeRerendered, 'image-xlinkhref');
        expect(updatedElementXlinkhref.getAttribute('xlink:href')).toEqual(imageURL);
    });

    it('should load correctly all elements other than images with proxy', async () => {
        addApiMock(`images`, () => {
            const response = {
                headers: { get: jest.fn() },
                blob: () => new Blob(),
            };
            return Promise.resolve(response);
        });

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
        addToCache('MailSettings', { ShowImages: SHOW_IMAGES.NONE, ImageProxy: IMAGE_PROXY_FLAGS.PROXY });

        initMessage(message);

        const { container, rerender, getByTestId } = await setup({}, false);
        const iframe = await getIframeRootDiv(container);

        // Need to mock this function to mock the blob url
        window.URL.createObjectURL = jest.fn(() => blobURL);

        // Check that all elements are displayed in their proton attributes before loading them
        const elementBackground = await findByTestId(iframe, 'image-background');
        expect(elementBackground.getAttribute('proton-background')).toEqual(imageURL);

        const elementPoster = await findByTestId(iframe, 'image-poster');
        expect(elementPoster.getAttribute('proton-poster')).toEqual(imageURL);

        const elementSrcset = await findByTestId(iframe, 'image-srcset');
        expect(elementSrcset.getAttribute('proton-srcset')).toEqual(imageURL);

        const elementXlinkhref = await findByTestId(iframe, 'image-xlinkhref');
        expect(elementXlinkhref.getAttribute('proton-xlink:href')).toEqual(imageURL);

        const loadButton = getByTestId('remote-content:load');

        fireEvent.click(loadButton);

        // Rerender the message view to check that images have been loaded
        await rerender(<MessageView {...defaultProps} />);
        const iframeRerendered = await getIframeRootDiv(container);

        // Check that proton attribute has been removed after images loading
        const updatedElementBackground = await findByTestId(iframeRerendered, 'image-background');
        expect(updatedElementBackground.getAttribute('background')).toEqual(blobURL);

        const updatedElementPoster = await findByTestId(iframeRerendered, 'image-poster');
        expect(updatedElementPoster.getAttribute('poster')).toEqual(blobURL);

        // srcset attribute is not loaded, so we need to check proton-srcset
        const updatedElementSrcset = await findByTestId(iframeRerendered, 'image-srcset');
        expect(updatedElementSrcset.getAttribute('proton-srcset')).toEqual(imageURL);

        const updatedElementXlinkhref = await findByTestId(iframeRerendered, 'image-xlinkhref');
        expect(updatedElementXlinkhref.getAttribute('xlink:href')).toEqual(blobURL);
    });

    it('should be able to load direct when proxy failed at loading', async () => {
        const imageURL = 'imageURL';
        const content = `<div><img proton-src="${imageURL}" data-testid="image"/></div>`;
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

        addApiMock(`images`, () => {
            const error = new Error();
            (error as any).data = { Code: 2902, Error: 'TEST error message' };
            return Promise.reject(error);
        });

        minimalCache();
        addToCache('MailSettings', { ShowImages: SHOW_IMAGES.NONE, ImageProxy: IMAGE_PROXY_FLAGS.PROXY });

        initMessage(message);

        const { getByTestId, getByText, rerender, container } = await setup({}, false);
        const iframe = await getIframeRootDiv(container);

        const image = await findByTestId(iframe, 'image');
        expect(image.getAttribute('proton-src')).toEqual(imageURL);

        let loadButton = getByTestId('remote-content:load');
        fireEvent.click(loadButton);

        // Rerender the message view to check that images have been loaded
        await rerender(<MessageView {...defaultProps} />);
        const iframeRerendered = await getIframeRootDiv(container);

        const placeholder = iframeRerendered.querySelector('.proton-image-placeholder') as HTMLImageElement;

        expect(placeholder).not.toBe(null);
        assertIcon(placeholder.querySelector('svg'), 'cross-circle');

        getByText('Load unprotected', { exact: false });

        loadButton = getByTestId('remote-content:load');
        fireEvent.click(loadButton);

        // Rerender the message view to check that images have been loaded
        await rerender(<MessageView {...defaultProps} />);

        const loadedImage = iframeRerendered.querySelector('.proton-image-anchor img') as HTMLImageElement;
        expect(loadedImage).toBeDefined();
        expect(loadedImage.getAttribute('src')).toEqual(imageURL);
    });
});

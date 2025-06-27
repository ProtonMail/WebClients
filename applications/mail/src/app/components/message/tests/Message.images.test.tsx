import { findByTestId, fireEvent, screen } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import { mockWindowLocation, resetWindowLocation } from '@proton/components/helpers/url.test.helpers';
import { parseDOMStringToBodyElement } from '@proton/mail/helpers/parseDOMStringToBodyElement';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { PROXY_IMG_URL } from '@proton/shared/lib/api/images';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '@proton/shared/lib/mail/mailSettings';

import { addApiMock, assertIcon, clearAll, minimalCache } from '../../../helpers/test/helper';
import MessageView from '../MessageView';
import { defaultProps, getIframeRootDiv, setup } from './Message.test.helpers';

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

jest.mock('@proton/mail/helpers/dom', () => ({
    ...jest.requireActual('@proton/mail/helpers/dom'),
}));

const windowHostname = 'https://mail.proton.pink';

describe('Message images', () => {
    beforeEach(() => {
        mockWindowLocation(windowHostname);
    });

    afterEach(() => {
        resetWindowLocation();
    });

    afterEach(clearAll);

    it('should display all elements other than images', async () => {
        const document = parseDOMStringToBodyElement(content);

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
                trackersStatus: 'not-loaded',
                images: [],
            },
        };

        minimalCache();

        const { container, rerender, getByTestId } = await setup(
            message,
            { labelID: '0' },
            {
                preloadedState: {
                    mailSettings: getModelState({ HideRemoteImages: SHOW_IMAGES.HIDE } as MailSettings),
                },
            }
        );

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
        const forgedURL = `${windowHostname}/api/${PROXY_IMG_URL}?Url=imageURL&DryRun=0&UID=uid`;
        const document = parseDOMStringToBodyElement(content);

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
                trackersStatus: 'not-loaded',
                images: [],
            },
        };

        minimalCache();

        const { container, rerender, getByTestId } = await setup(
            message,
            { labelID: '0' },
            {
                preloadedState: {
                    mailSettings: getModelState({
                        HideRemoteImages: SHOW_IMAGES.HIDE,
                        ImageProxy: IMAGE_PROXY_FLAGS.PROXY,
                    } as MailSettings),
                },
            }
        );

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
        expect(updatedElementBackground.getAttribute('background')).toEqual(forgedURL);

        const updatedElementPoster = await findByTestId(iframeRerendered, 'image-poster');
        expect(updatedElementPoster.getAttribute('poster')).toEqual(forgedURL);

        // srcset attribute is not loaded, so we need to check proton-srcset
        const updatedElementSrcset = await findByTestId(iframeRerendered, 'image-srcset');
        expect(updatedElementSrcset.getAttribute('proton-srcset')).toEqual(imageURL);

        const updatedElementXlinkhref = await findByTestId(iframeRerendered, 'image-xlinkhref');
        expect(updatedElementXlinkhref.getAttribute('xlink:href')).toEqual(forgedURL);
    });

    it('should be able to load direct when proxy failed at loading', async () => {
        const imageURL = 'imageURL';
        const content = `<div><img proton-src="${imageURL}" data-testid="image"/></div>`;
        const document = parseDOMStringToBodyElement(content);
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
                trackersStatus: 'not-loaded',
                images: [],
            },
        };

        addApiMock(PROXY_IMG_URL, () => {
            const error = new Error();
            (error as any).data = { Code: 2902, Error: 'TEST error message' };
            return Promise.reject(error);
        });

        minimalCache();

        const { rerender, container } = await setup(
            message,
            {},
            {
                preloadedState: {
                    mailSettings: getModelState({
                        HideRemoteImages: SHOW_IMAGES.HIDE,
                        ImageProxy: IMAGE_PROXY_FLAGS.PROXY,
                    } as MailSettings),
                },
            }
        );

        const iframe = await getIframeRootDiv(container);

        const image = await findByTestId(iframe, 'image');
        expect(image.getAttribute('proton-src')).toEqual(imageURL);

        let loadButton = screen.getByTestId('remote-content:load');
        fireEvent.click(loadButton);

        // Rerender the message view to check that images have been loaded through URL
        await rerender(<MessageView {...defaultProps} />);
        const iframeRerendered = await getIframeRootDiv(container);

        const placeholder = iframeRerendered.querySelector('.proton-image-placeholder') as HTMLImageElement;

        expect(placeholder).not.toBe(null);
        assertIcon(placeholder.querySelector('svg'), 'file-slash');

        loadButton = screen.getByTestId('remote-content:load');
        fireEvent.click(loadButton);

        // Rerender the message view to check that images have been loaded
        await rerender(<MessageView {...defaultProps} />);

        const loadedImage = iframeRerendered.querySelector('.proton-image-anchor img') as HTMLImageElement;
        expect(loadedImage).toBeDefined();
        expect(loadedImage.getAttribute('src')).toEqual(
            `https://mail.proton.pink/api/${PROXY_IMG_URL}?Url=${imageURL}&DryRun=0&UID=uid`
        );
    });
});

import { findByRole, findByText, fireEvent, screen, waitFor } from '@testing-library/react';

import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../../helpers/test/crypto';
import { EOBody, EOClearAll, EOSubject } from '../../../../helpers/test/eo/helpers';
import { getIframeRootDiv } from '../../../message/tests/Message.test.helpers';
import { setup } from './ViewEOMessage.test.helpers';

const blobURL = 'blobURL';
const embeddedCID = 'cid-embedded';
const embeddedAttachment = {
    ID: 'id3',
    Name: 'attachment-name-png.png',
    Size: 300,
    MIMEType: 'image/png',
    // Allow to skip actual download of the file content
    Preview: {
        data: new Uint8Array([1, 2]),
        filename: 'preview',
        signatures: [],
        verificationStatus: MAIL_VERIFICATION_STATUS.NOT_SIGNED,
    },
    KeyPackets: [],
    nameSplitStart: 'attachment-name-p',
    nameSplitEnd: 'ng.png',
    Headers: { 'content-id': embeddedCID, 'content-disposition': 'inline' },
};

describe('Encrypted Outside message images', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    afterEach(() => {
        EOClearAll();
    });

    it('should load remote images', async () => {
        const imageURL = 'imageURL';
        const body = `<div>${EOBody}<img src="${imageURL}"/></div>`;

        const { container } = await setup({ body });

        // wait for the message to be fully loaded
        await waitFor(() => screen.getByText(EOSubject));

        const iframe = await getIframeRootDiv(container);

        // Content is displayed
        await findByText(iframe, EOBody);

        // Check for image placeholder
        const placeholder = iframe.querySelector('.proton-image-placeholder') as HTMLImageElement;
        expect(placeholder).not.toBe(null);

        // Click on load banner
        screen.getByText('This message contains remote content.');

        const loadButton = screen.getByTestId('remote-content:load');
        fireEvent.click(loadButton);

        // Check that image has been loaded
        const image = await findByRole(iframe, 'img');
        expect(image.getAttribute('src')).toEqual(imageURL);
    });

    it('should load embedded images', async () => {
        const body = `<div>${EOBody}<img src="cid:${embeddedCID}"/></div>`;

        // Need to mock this function to mock the blob url
        window.URL.createObjectURL = jest.fn(() => blobURL);

        const { container } = await setup({ body, attachments: [embeddedAttachment] });

        // wait for the message to be fully loaded
        await waitFor(() => screen.getByText(EOSubject));

        const iframe = await getIframeRootDiv(container);

        // Content is displayed
        await findByText(iframe, EOBody);

        // Check for image placeholder
        const placeholder = iframe.querySelector('.proton-image-placeholder') as HTMLImageElement;
        expect(placeholder).not.toBe(null);

        // Click on load banner
        const loadButton = screen.getByText('Load embedded images');
        fireEvent.click(loadButton);

        // Check that image has been loaded
        const image = await findByRole(iframe, 'img');
        expect(image.getAttribute('src')).toEqual(blobURL);
    });
});

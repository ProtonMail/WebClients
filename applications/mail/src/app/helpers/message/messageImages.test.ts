import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import { MessageImage, MessageImages, MessageState } from '../../logic/messages/messagesTypes';
import { mockWindowLocation, resetWindowLocation } from '../test/helper';
import { createDocument } from '../test/message';
import { forgeImageURL, removeProxyURLAttributes, replaceProxyWithOriginalURLAttributes } from './messageImages';

const imageURL = 'imageURL';
const originalImageURL = 'originalImageURL';

describe('forgeImageURL', () => {
    const windowOrigin = 'https://mail.proton.pink';

    // Mock window location
    beforeAll(() => {
        mockWindowLocation(windowOrigin);
    });

    afterAll(() => {
        resetWindowLocation();
    });

    it('should forge the expected image URL', () => {
        const imageURL = 'https://example.com/image1.png';
        const uid = 'uid';
        const forgedURL = forgeImageURL(imageURL, uid);
        const expectedURL = `${windowOrigin}/api/core/v4/images?Url=${encodeURIComponent(
            imageURL
        )}&DryRun=0&UID=${uid}`;

        expect(forgedURL).toEqual(expectedURL);
    });
});

describe('removeProxyURLAttributes', () => {
    const content = `<div>
                        <img proton-src='${originalImageURL}-1' src='${imageURL}-1'/>
                        <table>
                            <tbody>
                                <tr>
                                    <td proton-background='${originalImageURL}-2' background='${imageURL}-2'>Element1</td>
                                </tr>
                            </tbody>
                       </table>

                       <video proton-poster='${originalImageURL}-3' poster='${imageURL}-3'>
                            <source src="" type="video/mp4">
                       </video>

                       <svg width="90" height="90">
                           <img proton-xlink:href='${originalImageURL}-4' xlink:href='${imageURL}-4'/>
                       </svg>
                  </div>`;

    it('should remove all proton urls from the content', () => {
        const messageImages = {
            hasRemoteImages: true,
            images: [
                { type: 'remote', url: `${imageURL}-1`, originalURL: `${originalImageURL}-1` } as MessageImage,
                { type: 'remote', url: `${imageURL}-2`, originalURL: `${originalImageURL}-2` } as MessageImage,
                { type: 'remote', url: `${imageURL}-3`, originalURL: `${originalImageURL}-3` } as MessageImage,
                { type: 'remote', url: `${imageURL}-4`, originalURL: `${originalImageURL}-4` } as MessageImage,
            ],
        } as MessageImages;

        const expectedContent = `<div>
                        <img proton-src="${originalImageURL}-1">
                        <table>
                            <tbody>
                                <tr>
                                    <td proton-background="${originalImageURL}-2">Element1</td>
                                </tr>
                            </tbody>
                       </table>

                       <video proton-poster="${originalImageURL}-3">
                            <source src="" type="video/mp4">
                       </video>

                       <svg width="90" height="90">
                           <img proton-xlink:href="${originalImageURL}-4">
                       </svg>
                  </div>`;

        const result = removeProxyURLAttributes(content, messageImages);

        expect(result).toEqual(expectedContent);
    });

    it('should return content when no messageImages', function () {
        const result = removeProxyURLAttributes(content, undefined);

        expect(result).toEqual(content);
    });

    it('should return content when no remote images', function () {
        const messageImages = {
            hasRemoteImages: false,
            images: [{ type: 'remote', url: '' } as MessageImage],
        } as MessageImages;

        const result = removeProxyURLAttributes(content, messageImages);

        expect(result).toEqual(content);
    });

    it('should return content when no images', function () {
        const messageImages = {
            hasRemoteImages: true,
            images: [] as MessageImage[],
        } as MessageImages;

        const result = removeProxyURLAttributes(content, messageImages);

        expect(result).toEqual(content);
    });

    it('should not remove urls from embedded images', () => {
        const cid = 'imageCID';

        const messageImages = {
            hasRemoteImages: true,
            images: [
                { type: 'remote', url: `${imageURL}-1`, originalURL: `${originalImageURL}-1` } as MessageImage,
                {
                    type: 'embedded',
                    cid,
                    cloc: '',
                    attachment: { Headers: { 'content-id': cid } } as Attachment,
                } as MessageImage,
            ],
        } as MessageImages;

        const content = `<div>
                            <img src="cid:${cid}"/>
                            <img proton-src="${originalImageURL}-1" src="${imageURL}-1"/>
                        </div>`;

        const expectedContent = `<div>
                            <img src="cid:${cid}">
                            <img proton-src="${originalImageURL}-1">
                        </div>`;

        const result = removeProxyURLAttributes(content, messageImages);

        expect(result).toEqual(expectedContent);
    });

    it('should not remove urls from images with no originalURL', () => {
        const messageImages = {
            hasRemoteImages: true,
            images: [
                { type: 'remote', url: `${imageURL}-1` } as MessageImage,
                { type: 'remote', url: `${originalImageURL}-2`, originalURL: `${originalImageURL}-2` } as MessageImage,
                { type: 'remote', url: `${imageURL}-3`, originalURL: `${originalImageURL}-3` } as MessageImage,
            ],
        } as MessageImages;

        const content = `<div>
                            <img src="${imageURL}-1"/>
                            <img proton-src="${originalImageURL}-2" src="${originalImageURL}-2"/>
                            <img proton-src="${originalImageURL}-3" src="${imageURL}-3"/>
                        </div>`;

        const expectedContent = `<div>
                            <img src="${imageURL}-1">
                            <img proton-src="${originalImageURL}-2">
                            <img proton-src="${originalImageURL}-3">
                        </div>`;

        const result = removeProxyURLAttributes(content, messageImages);

        expect(result).toEqual(expectedContent);
    });
});

describe('replaceProxyWithOriginalURLAttributes', () => {
    const content = `<div>
                        <img proton-src='${originalImageURL}-1' src='${imageURL}-1'/>
                        <img proton-src='${originalImageURL}-2' src='${originalImageURL}-2'/>
                        <img src='${originalImageURL}-3'/>
                        <img proton-src='${originalImageURL}-4'/>
                        <table>
                            <tbody>
                                <tr>
                                    <td proton-background='${originalImageURL}-5' background='${imageURL}-5' >Element1</td>
                                </tr>
                            </tbody>
                       </table>

                       <video proton-poster='${originalImageURL}-6' poster='${imageURL}-6'>
                            <source src="" type="video/mp4">
                       </video>

                       <svg width="90" height="90">
                           <img proton-xlink:href='${originalImageURL}-7' xlink:href='${imageURL}-7'/>
                       </svg>
                  </div>`;

    it('should remove proton attributes and use the original URL', () => {
        const messageImages = {
            hasRemoteImages: true,
            images: [
                { type: 'remote', url: `${imageURL}-1`, originalURL: `${originalImageURL}-1` } as MessageImage,
                { type: 'remote', url: `${originalImageURL}-2`, originalURL: `${originalImageURL}-2` } as MessageImage,
                { type: 'remote', url: `${imageURL}-3` } as MessageImage,
                { type: 'remote', url: `${imageURL}-4` } as MessageImage,
                { type: 'remote', url: `${imageURL}-5`, originalURL: `${originalImageURL}-5` } as MessageImage,
                { type: 'remote', url: `${imageURL}-6`, originalURL: `${originalImageURL}-6` } as MessageImage,
                { type: 'remote', url: `${imageURL}-7`, originalURL: `${originalImageURL}-7` } as MessageImage,
            ],
        } as MessageImages;

        const message = {
            messageImages,
        } as MessageState;

        const expected = `<div>
                        <img src="${originalImageURL}-1">
                        <img src="${originalImageURL}-2">
                        <img src="${originalImageURL}-3">
                        <img src="${originalImageURL}-4">
                        <table>
                            <tbody>
                                <tr>
                                    <td background="${originalImageURL}-5">Element1</td>
                                </tr>
                            </tbody>
                       </table>

                       <video poster="${originalImageURL}-6">
                            <source src="" type="video/mp4">
                       </video>

                       <svg width="90" height="90">
                           <img xlink:href="${originalImageURL}-7"></svg>
                  </div>`;

        const result = replaceProxyWithOriginalURLAttributes(message, createDocument(content));

        expect(result).toEqual(expected);
    });
});

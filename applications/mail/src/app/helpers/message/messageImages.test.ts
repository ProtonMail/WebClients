import { parseDOMStringToBodyElement } from 'proton-mail/helpers/test/helper';
import type { MessageImage, MessageImages, MessageState } from 'proton-mail/store/messages/messagesTypes';

import { removeProxyURLAttributes, replaceProxyWithOriginalURLAttributes } from './messageImages';

const imageURL = 'imageURL';
const originalImageURL = 'originalImageURL';

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
                           <image proton-xlink:href='${originalImageURL}-4' xlink:href='${imageURL}-4'/>
                       </svg>
                  </div>`;

    it('should remove all proton urls from the content', () => {
        const expectedContent = `<div>
                        <img src="${originalImageURL}-1">
                        <table>
                            <tbody>
                                <tr>
                                    <td background="${originalImageURL}-2">Element1</td>
                                </tr>
                            </tbody>
                       </table>

                       <video poster="${originalImageURL}-3">
                            <source src="" type="video/mp4">
                       </video>

                       <svg width="90" height="90">
                           <image xlink:href="${originalImageURL}-4"></image>
                       </svg>
                  </div>`;

        const result = removeProxyURLAttributes(content);

        expect(result).toEqual(expectedContent);
    });

    it('should not remove urls from embedded images', () => {
        const cid = 'imageCID';
        const content = `<div>
                            <img src="cid:${cid}"/>
                            <img proton-src="${originalImageURL}-1" src="${imageURL}-1"/>
                        </div>`;

        const expectedContent = `<div>
                            <img src="cid:${cid}">
                            <img src="${originalImageURL}-1">
                        </div>`;

        const result = removeProxyURLAttributes(content);

        expect(result).toEqual(expectedContent);
    });

    it('should not remove urls from images with no originalURL', () => {
        const content = `<div>
                            <img src="${imageURL}-1"/>
                            <img proton-src="${originalImageURL}-2" src="${originalImageURL}-2"/>
                            <img proton-src="${originalImageURL}-3" src="${imageURL}-3"/>
                        </div>`;

        const expectedContent = `<div>
                            <img src="${imageURL}-1">
                            <img src="${originalImageURL}-2">
                            <img src="${originalImageURL}-3">
                        </div>`;

        const result = removeProxyURLAttributes(content);

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
                           <image proton-xlink:href='${originalImageURL}-7' xlink:href='${imageURL}-7'/>
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
                           <image xlink:href="${originalImageURL}-7"></image>
                       </svg>
                  </div>`;

        const result = replaceProxyWithOriginalURLAttributes(message, parseDOMStringToBodyElement(content));

        expect(result).toEqual(expected);
    });
});

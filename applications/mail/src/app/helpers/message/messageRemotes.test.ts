import { parseDOMStringToBodyElement } from '@proton/mail/helpers/parseDOMStringToBodyElement';
import type { MessageRemoteImage } from '@proton/mail/store/messages/messagesTypes';

import { loadBackgroundImages, loadImages } from './messageRemotes';

describe('messageRemote', () => {
    describe('loadImages', () => {
        const imageURL = 'ImageURL';
        const originalURL = 'originalURL';

        const backgroundContent = `<div>
                                  <table>
                                        <tbody>
                                        <tr>
                                          <td proton-background='${originalURL}'>Element1</td>
                                         </tr>
                                        </tbody>
                                   </table>
                              </div>`;

        const backgroundExpectedContent = `<div>
                                  <table>
                                        <tbody>
                                        <tr>
                                          <td proton-background='${originalURL}' background='${imageURL}'>Element1</td>
                                         </tr>
                                        </tbody>
                                   </table>
                              </div>`;

        const posterContent = `<div>
                        <video proton-poster='${originalURL}'>
                              <source src="" type="video/mp4">
                        </video>
                  </div>`;

        const posterExpectedContent = `<div>
                        <video proton-poster='${originalURL}' poster='${imageURL}'>
                              <source src="" type="video/mp4">
                        </video>
                  </div>`;

        const xlinkhrefContent = `<div>
                              <svg width="90" height="90">
                               <image proton-xlink:href='${originalURL}'/>
                              </svg>
                            </div>`;

        const xlinkhrefExpectedContent = `<div>
                              <svg width="90" height="90">
                               <image proton-xlink:href='${originalURL}' xlink:href='${imageURL}'/>
                              </svg>
                            </div>`;

        const srcsetContent = `<div>
                              <picture>
                                <source media="(min-width:650px)" proton-srcset='${originalURL}' >
                                <img src='${imageURL}' >
                              </picture>
                            </div>`;

        const srcsetExpectedContent = `<div>
                              <picture>
                                <source media="(min-width:650px)" proton-srcset='${originalURL}' >
                                <img src='${imageURL}' >
                              </picture>
                            </div>`;

        it.each`
            content              | expectedContent
            ${backgroundContent} | ${backgroundExpectedContent}
            ${posterContent}     | ${posterExpectedContent}
            ${xlinkhrefContent}  | ${xlinkhrefExpectedContent}
        `('should load elements other than images', async ({ content, expectedContent }) => {
            const messageDocument = parseDOMStringToBodyElement(content);

            const remoteImages = [
                {
                    type: 'remote',
                    url: imageURL,
                    originalURL,
                    id: 'remote-0',
                    tracker: undefined,
                    status: 'loaded',
                },
            ] as MessageRemoteImage[];

            loadImages(remoteImages, messageDocument);

            const expectedDocument = parseDOMStringToBodyElement(expectedContent);

            expect(messageDocument.innerHTML).toEqual(expectedDocument.innerHTML);
        });

        it('should load all images at the same time', () => {
            const imageURL2 = 'ImageURL2';
            const originalURL2 = 'originalURL2';

            const content = `<div>
                                  <table>
                                        <tbody>
                                        <tr>
                                          <td proton-background='${originalURL}'>Element1</td>
                                          <td proton-background='${originalURL2}'>Element2</td>
                                         </tr>
                                        </tbody>
                                   </table>

                                   <video proton-poster='${originalURL}'>
                                        <source src="" type="video/mp4">
                                   </video>
                              </div>`;
            const expectedContent = `<div>
                                  <table>
                                        <tbody>
                                        <tr>
                                          <td proton-background='${originalURL}' background='${imageURL}'>Element1</td>
                                          <td proton-background='${originalURL2}' background='${imageURL2}'>Element2</td>
                                         </tr>
                                        </tbody>
                                   </table>

                                   <video proton-poster='${originalURL}' poster='${imageURL}'>
                                        <source src="" type="video/mp4">
                                   </video>
                              </div>`;

            const messageDocument = parseDOMStringToBodyElement(content);

            const remoteImages = [
                {
                    type: 'remote',
                    url: imageURL,
                    originalURL,
                    id: 'remote-0',
                    tracker: undefined,
                    status: 'loaded',
                },
                {
                    type: 'remote',
                    url: imageURL2,
                    originalURL: originalURL2,
                    id: 'remote-1',
                    tracker: undefined,
                    status: 'loaded',
                },
            ] as MessageRemoteImage[];

            loadImages(remoteImages, messageDocument);

            const expectedDocument = parseDOMStringToBodyElement(expectedContent);

            expect(messageDocument.innerHTML).toEqual(expectedDocument.innerHTML);
        });

        it('should not load srcset attribute', () => {
            const messageDocument = parseDOMStringToBodyElement(srcsetContent);

            const remoteImages = [
                {
                    type: 'remote',
                    url: imageURL,
                    originalURL,
                    id: 'remote-0',
                    tracker: undefined,
                    status: 'loaded',
                },
            ] as MessageRemoteImage[];

            loadImages(remoteImages, messageDocument);

            const expectedDocument = parseDOMStringToBodyElement(srcsetExpectedContent);

            expect(messageDocument.innerHTML).toEqual(expectedDocument.innerHTML);
        });
    });

    describe('loadBackgroundImages', () => {
        const imageURL = 'http://test.fr/img.jpg';
        const imageURL2 = 'http://test.fr/img2.jpg';
        const content = `<div style="background: proton-url(${imageURL})">Element1</div>`;
        const expectedContent = `<div style="background: url(${imageURL})">Element1</div>`;

        it('should load elements other than images', async () => {
            const messageDocument = parseDOMStringToBodyElement(content);
            const expectedDocument = parseDOMStringToBodyElement(expectedContent);

            const remoteImages = [
                {
                    type: 'remote',
                    url: imageURL,
                    originalURL: imageURL,
                    id: 'remote-0',
                    tracker: undefined,
                    status: 'loaded',
                },
            ] as MessageRemoteImage[];

            loadBackgroundImages({ images: remoteImages, document: messageDocument });
            expect(messageDocument.innerHTML).toEqual(expectedDocument.innerHTML);
        });

        it('should load all elements other than images at the same time', async () => {
            const content = `<div style="background: proton-url(${imageURL})">Element1</div><div style="background: proton-url(${imageURL})">Element2</div><div style="background: proton-url(${imageURL2})">Element3</div>`;
            const expectedContent = `<div style="background: url(${imageURL})">Element1</div><div style="background: url(${imageURL})">Element2</div><div style="background: url(${imageURL2})">Element3</div>`;

            const messageDocument = parseDOMStringToBodyElement(content);
            const expectedDocument = parseDOMStringToBodyElement(expectedContent);

            const remoteImages = [
                {
                    type: 'remote',
                    url: imageURL,
                    originalURL: imageURL,
                    id: 'remote-0',
                    tracker: undefined,
                    status: 'loaded',
                },
                {
                    type: 'remote',
                    url: imageURL2,
                    originalURL: imageURL2,
                    id: 'remote-0',
                    tracker: undefined,
                    status: 'loaded',
                },
            ] as MessageRemoteImage[];

            loadBackgroundImages({ images: remoteImages, document: messageDocument });
            expect(messageDocument.innerHTML).toEqual(expectedDocument.innerHTML);
        });
    });
});

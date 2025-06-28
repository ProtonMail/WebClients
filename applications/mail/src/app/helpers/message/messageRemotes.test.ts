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
    });
});

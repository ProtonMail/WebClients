import { MessageRemoteImage } from '../../logic/messages/messagesTypes';
import { createDocument } from '../test/message';
import { loadBackgroundImages, loadElementOtherThanImages } from './messageRemotes';

describe('messageRemote', () => {
    describe('loadElementOtherThanImages', () => {
        const imageURL = 'ImageURL';

        const backgroundContent = `<div>
                                  <table>
                                        <tbody>
                                        <tr>
                                          <td proton-background='${imageURL}'>Element1</td>
                                         </tr>
                                        </tbody>
                                   </table>
                              </div>`;

        const backgroundExpectedContent = `<div>
                                  <table>
                                        <tbody>
                                        <tr>
                                          <td background='${imageURL}'>Element1</td>
                                         </tr>
                                        </tbody>
                                   </table>
                              </div>`;

        const posterContent = `<div>
                        <video proton-poster='${imageURL}'>
                              <source src="" type="video/mp4">
                        </video>
                  </div>`;

        const posterExpectedContent = `<div>
                        <video poster='${imageURL}'>
                              <source src="" type="video/mp4">
                        </video>
                  </div>`;

        const xlinkhrefContent = `<div>
                              <svg width="90" height="90">
                               <image proton-xlink:href='${imageURL}'/>
                              </svg>
                            </div>`;

        const xlinkhrefExpectedContent = `<div>
                              <svg width="90" height="90">
                               <image xlink:href='${imageURL}'/>
                              </svg>
                            </div>`;

        const srcsetContent = `<div>
                              <picture>
                                <source media="(min-width:650px)" proton-srcset='${imageURL}' >
                                <img src='${imageURL}' >
                              </picture>
                            </div>`;

        const srcsetExpectedContent = `<div>
                              <picture>
                                <source media="(min-width:650px)" proton-srcset='${imageURL}' >
                                <img src='${imageURL}' >
                              </picture>
                            </div>`;

        it.each`
            content              | expectedContent
            ${backgroundContent} | ${backgroundExpectedContent}
            ${posterContent}     | ${posterExpectedContent}
            ${xlinkhrefContent}  | ${xlinkhrefExpectedContent}
        `('should load elements other than images', async ({ content, expectedContent }) => {
            const messageDocument = createDocument(content);

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

            loadElementOtherThanImages(remoteImages, messageDocument);

            const expectedDocument = createDocument(expectedContent);

            expect(messageDocument.innerHTML).toEqual(expectedDocument.innerHTML);
        });

        it('should not load srcset attribute', () => {
            const messageDocument = createDocument(srcsetContent);

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

            loadElementOtherThanImages(remoteImages, messageDocument);

            const expectedDocument = createDocument(srcsetExpectedContent);

            expect(messageDocument.innerHTML).toEqual(expectedDocument.innerHTML);
        });
    });

    describe('loadBackgroundImages', () => {
        const imageURL = 'http://test.fr/img.jpg';
        const content = `<div style="background: proton-url(${imageURL})">Element1</div>`;
        const expectedContent = `<div style="background: url(${imageURL})">Element1</div>`;

        it('should load elements other than images', async () => {
            const messageDocument = createDocument(content);
            const expectedDocument = createDocument(expectedContent);

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

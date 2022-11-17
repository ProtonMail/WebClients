import { MessageRemoteImage } from '../../logic/messages/messagesTypes';
import { createDocument } from '../test/message';
import { loadBackgroundImages, loadElementOtherThanImages } from './messageRemotes';

describe('messageRemote', () => {
    describe('loadElementOtherThanImages', () => {
        const imageURL = 'ImageURL';
        const imageURL2 = 'ImageURL2';

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

        const multipleElementsContent = `<div>
                                  <table>
                                        <tbody>
                                        <tr>
                                          <td proton-background='${imageURL}'>Element1</td>
                                         </tr>
                                         <tr>
                                          <td proton-background='${imageURL2}'>Element2</td>
                                         </tr>
                                        </tbody>
                                   </table>
                              </div>`;

        const multipleElementsExpectedContent1 = `<div>
                                  <table>
                                        <tbody>
                                        <tr>
                                          <td background='${imageURL}'>Element1</td>
                                         </tr>
                                         <tr>
                                          <td proton-background='${imageURL2}'>Element2</td>
                                         </tr>
                                        </tbody>
                                   </table>
                              </div>`;

        const multipleElementsExpectedContent2 = `<div>
                                  <table>
                                        <tbody>
                                        <tr>
                                          <td background='${imageURL}'>Element1</td>
                                         </tr>
                                         <tr>
                                          <td background='${imageURL2}'>Element2</td>
                                         </tr>
                                        </tbody>
                                   </table>
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

        it('should remove only the proton attribute of the current image when loading element other than images', async () => {
            const messageDocument = createDocument(multipleElementsContent);

            const remoteImage1 = {
                type: 'remote',
                url: imageURL,
                originalURL: imageURL,
                id: 'remote-0',
                tracker: undefined,
                status: 'loaded',
            } as MessageRemoteImage;

            const remoteImage2 = {
                type: 'remote',
                url: imageURL2,
                originalURL: imageURL2,
                id: 'remote-1',
                tracker: undefined,
                status: 'loaded',
            } as MessageRemoteImage;

            // Load the first image, only the first image has been replaced, and proton-attribute of other element is still present
            loadElementOtherThanImages([remoteImage1], messageDocument);

            const expectedDocument1 = createDocument(multipleElementsExpectedContent1);

            expect(messageDocument.innerHTML).toEqual(expectedDocument1.innerHTML);

            // Load the second image, both images are now replaced, and no proton-attribute is still present
            loadElementOtherThanImages([remoteImage2], expectedDocument1);

            const expectedDocument2 = createDocument(multipleElementsExpectedContent2);

            expect(expectedDocument1.innerHTML).toEqual(expectedDocument2.innerHTML);
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

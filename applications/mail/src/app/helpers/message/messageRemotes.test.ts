import { createDocument } from '../test/message';
import { MessageRemoteImage } from '../../models/message';
import { loadElementOtherThanImages } from './messageRemotes';

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

const srcsetContent = `<div>
                            <picture>
                              <source media="(min-width:650px)" proton-srcset='${imageURL}' >
                              <img src='${imageURL}' >
                            </picture>
                          </div>`;

const srcsetExpectedContent = `<div>
                            <picture>
                              <source media="(min-width:650px)" srcset='${imageURL}' >
                              <img src='${imageURL}' >
                            </picture>
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

describe('messageRemotes', () => {
    it.each`
        content              | expectedContent
        ${backgroundContent} | ${backgroundExpectedContent}
        ${posterContent}     | ${posterExpectedContent}
        ${srcsetContent}     | ${srcsetExpectedContent}
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
});

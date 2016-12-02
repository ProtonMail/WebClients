const fs = require('fs');
const path = require('path');

/**
 * Inspiration:
 * @link {http://labs.criteo.com/2016/06/1315/}
 */
module.exports = () => {

    const makeMediaMap = (filePaths) => {
        return filePaths.reduce((acc, { file, type }) => {
            acc[path.basename(file)] = {
                content: fs.readFileSync(file).toString('base64'),
                type
            };
            return acc;
        }, Object.create(null));
    };

    function dropMedia(filePaths = [], selector) {

        const MAP_FILES = makeMediaMap(filePaths);

        // select drop zone with the selectors
        element(selector).getWebElement()
            .then((selectedElement) => {

                // use executeAsyncScript to execute Javascript code in the browser context
                return browser.executeAsyncScript((MAP_FILES, domElement, callback) => {

                    // here we are in the browser context
                    // decode the media content with window.atob and create Blob objects
                    function b64toBlob(b64Data, contentType = '', sliceSize = 512) {
                        const byteCharacters = window.atob(b64Data);
                        const max = byteCharacters.length;
                        const byteArrays = [];

                        for (let offset = 0; offset < max; offset += sliceSize) {
                            const slice = byteCharacters.slice(offset, offset + sliceSize);
                            const byteNumbers = new Array(slice.length);

                            for (let i = 0; i < slice.length; i++) {
                                byteNumbers[i] = slice.charCodeAt(i);
                            }
                            const byteArray = new Uint8Array(byteNumbers);
                            byteArrays.push(byteArray);
                        }

                        return new Blob(byteArrays, { type: contentType });
                    }

                    // create the array of file objects to attach to the mouse drop event
                    const files = Object
                        .keys(MAP_FILES)
                        .map((fileName) => {
                            const { content, type = 'image/jpeg' } = MAP_FILES[fileName];
                            const blob = b64toBlob(content, type);
                            return new File([blob], fileName, {
                                lastModified: blob.lastModifiedDate,
                                type
                            });
                        });

                    const e = new MouseEvent('dragenter');
                    e.dataTransfer = {
                        dataTransfer: {
                            types: ['image/jpeg']
                        } };
                    domElement.dispatchEvent(e);

                    setTimeout(() => {
                        // create the mouse drop event
                        const event = new MouseEvent('drop');
                        event.dataTransfer = {
                            types: ['File'],
                            files,
                            item(i) {
                                return this.files[i];
                            },
                            length: files.length
                        };
                        // dispatch the event
                        $('.composer-dropzone')[0].dispatchEvent(event);
                        // call the callback function
                        callback();
                    }, 100);
                }, MAP_FILES, selectedElement);

            })
            .then(() => console.log('Drop:success'));

    }

    return { dropMedia };
};

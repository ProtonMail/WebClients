/**
 * @link {http://labs.criteo.com/2016/06/1315/}
 */
module.exports = (function ()
{
    // use fs and path Node modules to access the test files on the disk
    var fs = require("fs");
    var path = require("path")
    var out = {};

    // this is the exposed function
    // inputs are a lit of file path to upload and the selector to access the file drop zone
    out.dropMedia = function (filePaths, selector, MIMETypes)
    {
        const mediaList = filePaths.reduce((acc, file) => {
            acc[path.basename(file)] = fs.readFileSync(file).toString('base64');
            return acc;
        }, Object.create(null));

        // select drop zone with the selectors
        element(selector).getWebElement().then(function (selectedElement) {
            // use executeAsyncScript to execute Javascript code in the browser context
            browser.executeAsyncScript(function (mediaList, domElement, callback)
            {

                // here we are in the browser context
                // decode the media content with window.atob and create Blob objects
                var b64toBlob = function (b64Data, contentType, sliceSize)
                {
                    contentType = contentType || '';
                    sliceSize = sliceSize || 512;
                    var byteCharacters = window.atob(b64Data);
                    var byteArrays = [];
                    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize)
                    {
                        var slice = byteCharacters.slice(offset, offset + sliceSize);
                        var byteNumbers = new Array(slice.length);
                        for (var i = 0; i < slice.length; i++)
                        {
                            byteNumbers[i] = slice.charCodeAt(i);
                        }
                        var byteArray = new Uint8Array(byteNumbers);
                        byteArrays.push(byteArray);
                    }
                    var blob = new Blob(byteArrays, { type: contentType });
                    return blob;
                }
                // create the array of file objects to attach to the mouse drop event
                var files = [];
                fileNameList = Object.getOwnPropertyNames(mediaList);
                for (var index = 0, max = fileNameList.length; index < max; index++)
                {
                    var fileName = fileNameList[index];
                    var imageData = mediaList[fileName];
                    var blob = b64toBlob(imageData, 'image/jpeg');
                    var file = new File([blob], fileName, {
                        lastModified: blob.lastModifiedDate,
                        type: "image/jpeg"
                    });
                    files.push(file);
                }

                var e = new MouseEvent("dragenter");
                                // dispatch the event
                e.dataTransfer = {
                    dataTransfer: {
                        types: ["image/jpeg"]
                    } };
                domElement.dispatchEvent(e);



                setTimeout(() => {
                    // create the mouse drop event
                    var event = new MouseEvent("drop");
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
            }, mediaList, selectedElement).then(function (result)
            {
                console.log("Media uploaded...");
            });
        });
    }
    return out;
}());

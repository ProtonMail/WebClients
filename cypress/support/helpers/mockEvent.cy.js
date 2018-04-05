// create the array of file objects to attach to the mouse drop event
const formatFile = ({ blob, type = 'image/jpeg', fileName }) => {
    return new File([blob], fileName, {
        lastModified: blob.lastModifiedDate,
        type
    });
};

const getDropEvent = (list = []) => {
    const files = list.map(formatFile);
    return {
        dataTransfer: {
            types: ['File'],
            files,
            item(i) {
                return this.files[i];
            },
            length: files.length
        }
    };
};

const getDragEnterEvent = (uploadable = true, files = []) => {
    if (uploadable) {
        return {
            dataTransfer: {
                types: ['image/gif', 'image/jpeg', 'image/png', 'image/bmp'],
                files
            }
        };
    }

    return {
        dataTransfer: {
            types: ['text/html', 'text/plain', 'text/uri-list'],
            files
        }
    };
};

module.exports = { getDropEvent, getDragEnterEvent };

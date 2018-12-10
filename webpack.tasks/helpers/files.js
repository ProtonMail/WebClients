const path = require('path');
const fs = require('fs');
const createHash = require('crypto').createHash;

const id = (path, contents) => contents;

const defaultPath = ({ basename, ext, hash }) => [basename, ext, hash].filter(Boolean).join('.');

/**
 * Transform a file with an optional shasum.
 * @param {String} filepath
 * @param {boolean} hash
 * @param {Function} transformPath
 * @param {Function} transform
 * @returns {Array}
 */
const transformFile = ({
    filepath = '',
    hash: shouldHash = false,
    transformPath = defaultPath,
    transform = id,
    encoding = 'utf8'
}) => {
    const contents = fs.readFileSync(filepath, { encoding });
    const transformedContents = transform(filepath, contents);

    const hash = shouldHash
        ? createHash('sha1')
              .update(transformedContents, encoding)
              .digest('hex')
        : '';

    const ext = path.extname(filepath);
    const basename = path.basename(filepath, ext);

    const transformedPath = transformPath({ filepath, basename, ext: ext.slice(1), hash });

    return {
        filepath: transformedPath,
        contents: transformedContents
    };
};

module.exports = {
    transformFile
};

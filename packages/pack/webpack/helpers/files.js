const path = require('path');
const createHash = require('crypto').createHash;
const fs = require('fs');

const SRI_ALGORITHM = 'sha384';

const getHash = (out, encoding) =>
    createHash('sha1')
        .update(out, encoding)
        .digest('hex');

const integrityHelper = (out, encoding, algorithm) =>
    createHash(algorithm)
        .update(out, encoding)
        .digest('base64');

const getIntegrity = (out, encoding) => `${SRI_ALGORITHM}-${integrityHelper(out, encoding, SRI_ALGORITHM)}`;

const defaultPath = ({ basename, ext, hash }) => [basename, hash, ext].filter(Boolean).join('.');
const defaultContents = (path, contents) => contents;

/**
 * Transform a file with an optional shasum.
 * @param {String} filepath
 * @param {boolean} hash
 * @param {Function} transformPath
 * @param {Function} transformContents
 * @returns {Array}
 */
const transformFile = ({
    filepath = '',
    hash: shouldHash = false,
    transformPath = defaultPath,
    transformContents = defaultContents,
    encoding = 'utf8'
}) => {
    const contents = fs.readFileSync(filepath, { encoding });
    const transformedContents = transformContents(filepath, contents);

    const hash = shouldHash ? getHash(transformedContents, encoding) : '';

    const ext = path.extname(filepath);
    const basename = path.basename(filepath, ext);

    const transformedPath = transformPath({ filepath, basename, ext: ext.slice(1), hash });

    const integrity = getIntegrity(transformedContents, encoding);

    return {
        filepath: transformedPath,
        contents: transformedContents,
        integrity
    };
};

module.exports = transformFile;

const path = require('path');

const transformFile = require('./files');

const getDefineObject = (publicPath, { filepath, integrity }) => {
    return {
        filepath: path.join(publicPath, filepath),
        integrity
    };
};

const transformWorkerContents = (path, contents) => contents.replace('importScripts("openpgp.min.js");', '');

const transformCompatPath = ({ basename, ext, hash }) => [basename, 'compat', hash, ext].join('.');

const transform = (paths, publicPath, isDistRelease) => {
    const main = transformFile({
        filepath: path.resolve(paths.main),
        hash: isDistRelease
    });

    const elliptic = transformFile({
        filepath: path.resolve(paths.elliptic),
        hash: isDistRelease
    });

    const compat = transformFile({
        filepath: path.resolve(paths.compat),
        hash: isDistRelease,
        transformPath: transformCompatPath
    });

    const worker = transformFile({
        filepath: path.resolve(paths.worker),
        hash: isDistRelease,
        transformContents: transformWorkerContents
    });

    const getDefinition = () => {
        return {
            main: getDefineObject(publicPath, main),
            compat: getDefineObject(publicPath, compat),
            elliptic: getDefineObject(publicPath, elliptic),
            worker: getDefineObject(publicPath, worker)
        };
    };

    return {
        main,
        worker,
        compat,
        elliptic,
        definition: getDefinition()
    };
};

module.exports = transform;

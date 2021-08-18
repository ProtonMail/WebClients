import _startcase from 'lodash.startcase';

const caseString = (str: string, caseFilename: boolean = true) => {
    // avoid _startcase stripping the '/'
    return str
        .split('/')
        .map((item, index, arr) => {
            if (!caseFilename && index === arr.length - 1) {
                return item;
            }

            return _startcase(item);
        })
        .join('/');
};

export const getTitle = (filename: string, caseFilename?: boolean) => {
    const directoryPrefix = 'src/stories/';
    const storySuffix = /.stories.(tsx|mdx)/;
    const strippedFileName = filename.replace(directoryPrefix, '').replace(storySuffix, '');

    return caseString(strippedFileName, caseFilename);
};

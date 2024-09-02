import startCase from 'lodash/startCase';

const caseString = (str: string, caseFilename: boolean = true) => {
    // avoid startCase stripping the '/'
    return str
        .split('/')
        .map((item, index, arr) => {
            if (!caseFilename && index === arr.length - 1) {
                return item;
            }

            return startCase(item);
        })
        .join('/');
};

export const getTitle = (filename: string, caseFilename?: boolean) => {
    const directoryPrefix = 'src/stories/';
    const storySuffix = /.stories.(tsx|mdx)/;
    const strippedFileName = filename.replace(directoryPrefix, '').replace(storySuffix, '');

    return caseString(strippedFileName, caseFilename);
};

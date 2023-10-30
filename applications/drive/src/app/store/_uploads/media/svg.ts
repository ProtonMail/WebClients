import { SupportedMimeTypes, THUMBNAIL_MAX_SIDE } from '@proton/shared/lib/drive/constants';
import { isFirefox } from '@proton/shared/lib/helpers/browser';
import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';

import { scaleImageFile } from './image';

function parseSvg(string: string) {
    return parseStringToDOM(string, 'image/svg+xml');
}

async function setSvgSize(imageBlob: Blob, size: number) {
    const text = await imageBlob.text();

    const doc = parseSvg(text);
    const svgElement = doc.querySelector('svg');

    const svgWidth = svgElement?.getAttribute('width') || `${size}px`;
    const svgHeight = svgElement?.getAttribute('height') || `${size}px`;

    svgElement?.setAttribute('width', svgWidth);
    svgElement?.setAttribute('height', svgHeight);

    const svgString = svgElement?.outerHTML || '';

    return new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
}

export async function scaleSvgFile(file: Blob) {
    let fileToScale = file;

    /*
     * We need to manually set size to svg files in case of
     * Firefox browser, otherwise drawImage() results in blank
     * canvas which leads to empty thumbnail.
     * More info: https://bugzilla.mozilla.org/show_bug.cgi?id=700533
     */
    if (isFirefox()) {
        fileToScale = await setSvgSize(file, THUMBNAIL_MAX_SIDE);
    }

    return scaleImageFile({ file: fileToScale, mimeType: SupportedMimeTypes.svg });
}

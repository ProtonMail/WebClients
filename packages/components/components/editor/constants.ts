import { Direction } from 'roosterjs-editor-types';
import { EditorMetadata } from './interface';

/**
 * Can be unique because set inside iframe
 */
export const ROOSTER_EDITOR_WRAPPER_ID = 'rooster-editor-wrapper';
export const ROOSTER_EDITOR_ID = 'rooster-editor';
export const EDITOR_BLOCKQUOTE_TOGGLE_CONTAINER_ID = 'proton-editor-toggle-container';

/**
 * Rooster snapshot max size limit
 * Source : https://github.com/microsoft/roosterjs/blob/a27dcb9a28092d2b160b27bcb8456b751e5309e2/packages/roosterjs-editor-core/lib/corePlugins/UndoPlugin.ts#L23
 */
export const ROOSTER_SNAPSHOTS_MAX_SIZE = 1e7;

/**
 * List of iframe events to bubble
 */
export const IFRAME_EVENTS_LIST: Event['type'][] = [
    'dragenter',
    'dragleave',
    'dragover',
    'drop',
    'keydown',
    'click',
    'input',
];

export const FONT_FACE = {
    Georgia: 'georgia',
    Arial: 'arial',
    Helvetica: 'helvetica',
    Monospace: 'menlo, consolas, courier new, monospace',
    Tahoma: 'tahoma, sans-serif',
    Verdana: 'verdana',
    'Times New Roman': 'times new roman',
    'Trebuchet MS': 'trebuchet ms',
};
export const DEFAULT_FONT_FACE = FONT_FACE.Arial;

export enum FONT_SIZES {
    '10px' = '7.5pt',
    '12px' = '9pt',
    '14px' = '10.5pt',
    '16px' = '12pt',
    '18px' = '13.5pt',
    '20px' = '15pt',
    '22px' = '16.5pt',
    '24px' = '18pt',
    '26px' = '19.5pt',
}
export const DEFAULT_FONT_SIZE = 14;

export const DEFAULT_FONT_COLOR = '#222222';
export const DEFAULT_BACKGROUND = '#FFFFFF';

export const FONT_COLORS = [
    /* white */
    '#FFFFFF',
    '#DADADA',
    '#B5B5B5',
    '#909090',
    '#6B6B6B',
    '#464646',
    '#222222',
    /* magenta */
    '#F6CBCB',
    '#EC9798',
    '#E36667',
    '#ED4139',
    '#CF3932',
    '#9A2B25',
    '#681D19',
    /* blue */
    '#CDE1F2',
    '#9CC3E5',
    '#6CA6D9',
    '#3B83C2',
    '#2A47F6',
    '#145390',
    '#0F3A62',
    /* green */
    '#D7EAD3',
    '#B3D6A9',
    '#8FC380',
    '#77F241',
    '#66A657',
    '#3A762B',
    '#29501F',
    /* yellow */
    '#FFF2CD',
    '#FEE59C',
    '#FCD86F',
    '#FDF84E',
    '#F2C246',
    '#BE8F35',
    '#7F6124',
];

export const HEADER_CLASS = 'h4';
export const DEFAULT_LINK = '';
export const DEFAULT_IMAGE = '';
export const RGB_REGEX = /rgb\((\d+)\s*,\s*(\d+),\s*(\d+)\)/;
export const EMBEDDABLE_TYPES = ['image/gif', 'image/jpeg', 'image/png', 'image/bmp'];

export const EDITOR_DEFAULT_METADATA: EditorMetadata = {
    supportImages: true,
    supportPlainText: false,
    supportDefaultFontSelector: false,
    isPlainText: false,
    supportRightToLeft: false,
    rightToLeft: Direction.LeftToRight,
};

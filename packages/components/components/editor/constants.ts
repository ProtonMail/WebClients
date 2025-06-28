import { c } from 'ttag';

import { DIRECTION } from '@proton/shared/lib/mail/mailSettings';

import type { EditorMetadata } from './interface';

/**
 * Can be unique because set inside iframe
 */
export const ROOSTER_EDITOR_WRAPPER_ID = 'rooster-editor-wrapper';
export const ROOSTER_EDITOR_ID = 'rooster-editor';
export const EDITOR_BLOCKQUOTE_TOGGLE_CONTAINER_ID = 'proton-editor-toggle-container';
export const EDITOR_DROPZONE = 'proton-editor-dropzone';

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

type FontFace =
    | 'SANS_SERIF'
    | 'SERIF'
    | 'GEORGIA'
    | 'ARIAL'
    | 'HELVETICA'
    | 'MONOSPACE'
    | 'TAHOMA'
    | 'VERDANA'
    | 'TIMES_NEW_ROMAN'
    | 'TREBUCHET_MS';

/**
 * Used in composer font selector
 */
export const FONT_FACES: Record<FontFace, { id: string; label: string; value: string }> = {
    SANS_SERIF: {
        id: 'Sans-serif',
        label: 'Sans Serif',
        value: 'sans-serif',
    },
    SERIF: {
        id: 'Serif',
        label: 'Serif',
        value: 'serif',
    },
    GEORGIA: {
        id: 'Georgia',
        label: 'Georgia',
        value: 'Georgia, serif',
    },
    ARIAL: {
        id: 'Arial',
        label: 'Arial',
        value: 'Arial, sans-serif',
    },
    HELVETICA: {
        id: 'Helvetica',
        label: 'Helvetica',
        value: 'Helvetica, sans-serif',
    },
    MONOSPACE: {
        id: 'Menlo, Consolas, Courier New, Monospace',
        label: 'Monospace',
        value: 'Menlo, Consolas, Courier New, Monospace',
    },
    TAHOMA: {
        id: 'Tahoma, sans-serif',
        label: 'Tahoma',
        value: 'Tahoma, sans-serif',
    },
    VERDANA: {
        id: 'Verdana',
        label: 'Verdana',
        value: 'Verdana, sans-serif',
    },
    TIMES_NEW_ROMAN: {
        id: 'Times New Roman',
        label: 'Times New Roman',
        value: 'Times New Roman, serif',
    },
    TREBUCHET_MS: {
        id: 'Trebuchet MS',
        label: 'Trebuchet MS',
        value: 'Trebuchet MS, sans-serif',
    },
};

export const DEFAULT_FONT_FACE = FONT_FACES.ARIAL.value;
export const DEFAULT_FONT_FACE_ID = FONT_FACES.ARIAL.id;

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

export const DEFAULT_FONT_COLOR = '#000000';
export const DEFAULT_BACKGROUND = '#FFFFFF';

export const FONT_COLORNAMES = {
    /* white */
    '#FFFFFF': () => c('color').t`white`,
    '#DADADA': () => c('color').t`gainsboro`,
    '#B5B5B5': () => c('color').t`philippine silver`,
    '#909090': () => c('color').t`philippine gray`,
    '#6B6B6B': () => c('color').t`dim gray`,
    '#464646': () => c('color').t`outer space`,
    '#000000': () => c('color').t`black`,
    /* magenta */
    '#F6CBCB': () => c('color').t`light red`,
    '#EC9798': () => c('color').t`ruddy pink`,
    '#E36667': () => c('color').t`light carmine pink`,
    '#ED4139': () => c('color').t`cinnabar`,
    '#CF3932': () => c('color').t`persian red`,
    '#9A2B25': () => c('color').t`vivid auburn`,
    '#681D19': () => c('color').t`persian plum`,
    /* blue */
    '#CDE1F2': () => c('color').t`azureish white`,
    '#9CC3E5': () => c('color').t`pale cerulean`,
    '#6CA6D9': () => c('color').t`blue-gray`,
    '#3B83C2': () => c('color').t`cyan-blue azure`,
    '#2A47F6': () => c('color').t`palatinate blue`,
    '#145390': () => c('color').t`dark cerulean`,
    '#0F3A62': () => c('color').t`dark midnight blue`,
    /* green */
    '#D7EAD3': () => c('color').t`pastel gray`,
    '#B3D6A9': () => c('color').t`light moss green`,
    '#8FC380': () => c('color').t`pistachio`,
    '#77F241': () => c('color').t`kiwi`,
    '#66A657': () => c('color').t`apple`,
    '#3A762B': () => c('color').t`japanese laurel`,
    '#29501F': () => c('color').t`mughal green`,
    /* yellow */
    '#FFF2CD': () => c('color').t`blanched almond`,
    '#FEE59C': () => c('color').t`caramel`,
    '#FCD86F': () => c('color').t`dandelion`,
    '#FDF84E': () => c('color').t`lemon yellow`,
    '#F2C246': () => c('color').t`maize`,
    '#BE8F35': () => c('color').t`satin sheen gold`,
    '#7F6124': () => c('color').t`field drab`,
} as const;

export const FONT_COLORS = Object.keys(FONT_COLORNAMES) as string[];

export const HEADER_CLASS = 'h4';
export const DEFAULT_LINK = '';
export const DEFAULT_IMAGE = '';
export const RGB_REGEX = /rgb\((\d+)\s*,\s*(\d+),\s*(\d+)\)/;
export const EMBEDDABLE_TYPES = ['image/gif', 'image/jpeg', 'image/png', 'image/bmp'];

export const EDITOR_DEFAULT_METADATA: EditorMetadata = {
    supportFiles: true,
    supportPlainText: false,
    supportDefaultFontSelector: false,
    isPlainText: false,
    supportRightToLeft: false,
    rightToLeft: DIRECTION.LEFT_TO_RIGHT,
    blockquoteExpanded: true,
    setBlockquoteExpanded: undefined,
};

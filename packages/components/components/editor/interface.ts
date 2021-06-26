import { RIGHT_TO_LEFT } from '@proton/shared/lib/constants';

export enum ALIGNMENT {
    Left = 'left',
    Center = 'center',
    Justify = 'justify',
    Right = 'right',
}

export interface SquireEditorMetadata {
    supportImages: boolean;
    supportPlainText: boolean;
    isPlainText: boolean;
    supportRightToLeft: boolean;
    rightToLeft: RIGHT_TO_LEFT;
}

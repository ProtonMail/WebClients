import { IEditor } from 'roosterjs-editor-types';

export interface ModalLinkProps {
    editor: IEditor;
    createLink: (editor: IEditor, link: string, altText?: string, displayText?: string) => void;
}

export interface ModalImageProps {
    onAddUrl: (url: string) => void;
    onAddImages: (files: File[]) => void;
}

export interface ModalDefaultFontProps {
    onChange: (nextFontFace: string, nextFontSize: number) => void;
}

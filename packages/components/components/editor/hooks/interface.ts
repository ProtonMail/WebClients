export interface ModalLinkProps {
    linkLabel: string | undefined;
    linkUrl: string | undefined;
    onSubmit: (title: string, url: string) => void;
}

export interface ModalImageProps {
    onAddUrl: (url: string) => void;
    onAddImages: (files: File[]) => void;
}

export interface ModalDefaultFontProps {
    onChange: (nextFontFace: string, nextFontSize: number) => void;
}

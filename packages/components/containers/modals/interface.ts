export interface Modal {
    id: string;
    content: JSX.Element;
    isClosing: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    isBehind?: boolean;
}

export interface ModalManager {
    createModal: (content: JSX.Element, id?: string) => string;
    hideModal: (id: string) => void;
    removeModal: (id: string) => void;
    getModal: (id: string) => Modal | undefined;
}

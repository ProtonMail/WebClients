export enum ModalType {
    BookingPageCreation = 'bookingPageCreation',
    BookingPageConfirmClose = 'bookingPageConfirmClose',
}

export interface BookingPageCreationModalPayload {
    type: ModalType.BookingPageCreation;
    value: {
        bookingLink: string;
        onClose: () => void;
    };
}

export interface BookingPageConfirmCloseModalPayload {
    type: ModalType.BookingPageConfirmClose;
    value: {
        onClose: () => void;
    };
}

export type ModalPayload = BookingPageCreationModalPayload | BookingPageConfirmCloseModalPayload;
export type ModalListener = (payload: ModalPayload) => void;

export interface GlobalModal {
    subscribe: (cb: ModalListener) => void;
    notify: (payload: ModalPayload) => void;
}

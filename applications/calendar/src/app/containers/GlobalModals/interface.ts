export enum ModalType {
    BookingPageCreation = 'bookingPageCreation',
}

export interface BookingPageCreationModalPayload {
    type: ModalType.BookingPageCreation;
    value: {
        bookingLink: string;
        onConfirm: () => void;
    };
}

export type ModalPayload = BookingPageCreationModalPayload;
export type ModalListener = (payload: ModalPayload) => void;

export interface GlobalModal {
    subscribe: (cb: ModalListener) => void;
    notify: (payload: ModalPayload) => void;
}

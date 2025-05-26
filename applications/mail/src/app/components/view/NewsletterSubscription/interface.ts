export type ModalFilterType = 'MarkAsRead' | 'MoveToArchive' | 'MoveToTrash';

export enum UnsubscribeMethod {
    OneClick = 'one-click',
    Mailto = 'mailto',
    HttpClient = 'http-client',
}

export const MAX_LENGTH_SUB_NAME = 30;

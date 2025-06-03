import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

export type ModalFilterType = 'MarkAsRead' | 'MoveToArchive' | 'MoveToTrash';

export enum UnsubscribeMethod {
    OneClick = 'one-click',
    Mailto = 'mailto',
    HttpClient = 'http-client',
}

export const MAX_LENGTH_SUB_NAME = 30;

export interface PropsWithNewsletterSubscription {
    subscription: NewsletterSubscription;
}

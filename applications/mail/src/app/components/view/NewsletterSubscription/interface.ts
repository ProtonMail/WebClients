import type { IconName } from '@proton/components/components/icon/Icon';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

export type ModalFilterType = 'MarkAsRead' | 'MoveToArchive' | 'MoveToTrash' | 'RemoveFromList';

export enum UnsubscribeMethod {
    OneClick = 'one-click',
    Mailto = 'mailto',
    HttpClient = 'http-client',
}

export const MAX_LENGTH_SUB_NAME = 30;

export interface PropsWithNewsletterSubscription {
    subscription: NewsletterSubscription;
}

export interface GetUnsubscribeDataParams {
    trash: boolean;
    archive: boolean;
    read: boolean;
}

export interface NewsletterSubscriptionFilterState {
    markingAsRead: boolean;
    movingToArchive: boolean;
    movingToTrash: boolean;
}

export interface MenuItem {
    icon: IconName;
    label: string;
    filter: ModalFilterType;
}

export interface FilterDropdownData extends NewsletterSubscriptionFilterState {
    isFilterEnabled: boolean;
    menuItems: MenuItem[];
}

export enum NewsletterSubscriptionAction {
    unsubscribe = 'unsubscribe',
    moveToFolder = 'moveToFolder',
    blockSender = 'blockSender',
    createAndMoveToFolder = 'createAndMoveToFolder',
    createFolderUpsell = 'createFolderUpsell',
}

export enum NewsletterMessagesAction {
    markAsRead = 'markAsRead',
    moveToArchive = 'moveToArchive',
    moveToTrash = 'moveToTrash',
    filterUpsell = 'filterUpsell',
    removeFromList = 'removeFromList',
}

export enum NewsletterFolderDestination {
    trash = 'trash',
    archive = 'archive',
    customFolder = 'customFolder',
}

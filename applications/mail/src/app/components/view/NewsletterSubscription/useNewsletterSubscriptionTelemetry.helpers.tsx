import { type ModalFilterType, NewsletterFolderDestination, NewsletterMessagesAction } from './interface';

export const getNewlsetterCountDimension = (count: number) => {
    if (count >= 1000) {
        return '>1000';
    }

    if (count >= 500) {
        return '>=500';
    }

    if (count >= 400) {
        return '>=400';
    }

    if (count >= 300) {
        return '>=300';
    }

    if (count >= 200) {
        return '>=200';
    }

    if (count >= 100) {
        return '>=100';
    }

    return '<100';
};

export const getNewsletterMessagesAction = (filterType: ModalFilterType) => {
    switch (filterType) {
        case 'MarkAsRead':
            return NewsletterMessagesAction.markAsRead;
        case 'MoveToArchive':
            return NewsletterMessagesAction.moveToArchive;
        case 'MoveToTrash':
            return NewsletterMessagesAction.moveToTrash;
        case 'RemoveFromList':
            return NewsletterMessagesAction.removeFromList;
    }
};

export const getNewsletterDestinationFolder = (
    trash: boolean,
    archive: boolean,
    customFolder?: boolean
): NewsletterFolderDestination | undefined => {
    if (trash) {
        return NewsletterFolderDestination.trash;
    }

    if (archive) {
        return NewsletterFolderDestination.archive;
    }

    if (customFolder) {
        return NewsletterFolderDestination.customFolder;
    }

    return undefined;
};

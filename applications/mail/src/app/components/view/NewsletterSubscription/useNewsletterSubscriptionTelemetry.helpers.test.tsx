import { NewsletterFolderDestination, NewsletterMessagesAction } from './interface';
import {
    getNewlsetterCountDimension,
    getNewsletterDestinationFolder,
    getNewsletterMessagesAction,
} from './useNewsletterSubscriptionTelemetry.helpers';

describe('useNewsletterSubscriptionTelemetry.helpers', () => {
    describe('getNewlsetterCountDimension', () => {
        it('Should return the correct dimension for 1000', () => {
            expect(getNewlsetterCountDimension(1000)).toBe('>1000');
        });

        it('Should return the correct dimension for 500', () => {
            expect(getNewlsetterCountDimension(500)).toBe('>=500');
        });

        it('Should return the correct dimension for 400', () => {
            expect(getNewlsetterCountDimension(400)).toBe('>=400');
        });

        it('Should return the correct dimension for 300', () => {
            expect(getNewlsetterCountDimension(300)).toBe('>=300');
        });

        it('Should return the correct dimension for 200', () => {
            expect(getNewlsetterCountDimension(200)).toBe('>=200');
        });

        it('Should return the correct dimension for 100', () => {
            expect(getNewlsetterCountDimension(100)).toBe('>=100');
        });

        it('Should return the correct dimension for 0', () => {
            expect(getNewlsetterCountDimension(0)).toBe('<100');
        });
    });

    describe('getNewsletterMessagesAction', () => {
        it('Should return the correct action for MarkAsRead', () => {
            expect(getNewsletterMessagesAction('MarkAsRead')).toBe(NewsletterMessagesAction.markAsRead);
        });

        it('Should return the correct action for MoveToArchive', () => {
            expect(getNewsletterMessagesAction('MoveToArchive')).toBe(NewsletterMessagesAction.moveToArchive);
        });

        it('Should return the correct action for MoveToTrash', () => {
            expect(getNewsletterMessagesAction('MoveToTrash')).toBe(NewsletterMessagesAction.moveToTrash);
        });

        it('Should return the correct action for RemoveFromList', () => {
            expect(getNewsletterMessagesAction('RemoveFromList')).toBe(NewsletterMessagesAction.removeFromList);
        });
    });

    describe('getNewsletterDestinationFolder', () => {
        it('Should return the correct folder for trash', () => {
            expect(getNewsletterDestinationFolder(true, false, false)).toBe(NewsletterFolderDestination.trash);
        });

        it('Should return the correct folder for archive', () => {
            expect(getNewsletterDestinationFolder(false, true, false)).toBe(NewsletterFolderDestination.archive);
        });

        it('Should return the correct folder for custom folder', () => {
            expect(getNewsletterDestinationFolder(false, false, true)).toBe(NewsletterFolderDestination.customFolder);
        });
    });
});

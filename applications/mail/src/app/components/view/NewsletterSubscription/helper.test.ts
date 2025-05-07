import type { Filter } from '@proton/components/containers/filters/interfaces';
import { FILTER_STATUS, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, UserModel } from '@proton/shared/lib/interfaces';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import {
    getFilterData,
    getSubscriptionMoveToFolderName,
    getUnsubscribeData,
    shouldOpenUpsellOnFilterClick,
} from './helper';

const simpleSubscription = {} as NewsletterSubscription;

const simpleFolders = [
    {
        Name: 'testing',
        ID: 'testing',
    } as Folder,
    {
        Name: 'testing2',
        ID: 'testing2',
    } as Folder,
];

describe('Newsletter subscriptions helpers', () => {
    describe('getFilterData', () => {
        it('Should return the values for MarkAsRead when not applying to future', () => {
            const resultFuture = getFilterData('MarkAsRead', simpleSubscription, true);
            expect(resultFuture).toEqual({
                ApplyTo: 'All',
                MarkAsRead: true,
            });
        });

        it('Should return the values for MarkAsRead when applying to existing', () => {
            const resultExisting = getFilterData('MarkAsRead', simpleSubscription, false);
            expect(resultExisting).toEqual({
                ApplyTo: 'Existing',
                MarkAsRead: true,
            });
        });

        it('Should return the values for MoveToArchive when applying to future', () => {
            const resultFuture = getFilterData('MoveToArchive', simpleSubscription, true);
            expect(resultFuture).toEqual({
                ApplyTo: 'All',
                DestinationFolder: MAILBOX_LABEL_IDS.ARCHIVE,
                MarkAsRead: false,
            });
        });

        it('Should return the values for MoveToArchive when applying to existing', () => {
            const resultExisting = getFilterData('MoveToArchive', simpleSubscription, false);
            expect(resultExisting).toEqual({
                ApplyTo: 'Existing',
                DestinationFolder: MAILBOX_LABEL_IDS.ARCHIVE,
                MarkAsRead: false,
            });
        });

        it('Should return the values for MoveToArchive when applying to existing and read', () => {
            const resultExistingRead = getFilterData(
                'MoveToArchive',
                { ...simpleSubscription, MarkAsRead: true },
                false
            );
            expect(resultExistingRead).toEqual({
                ApplyTo: 'Existing',
                DestinationFolder: MAILBOX_LABEL_IDS.ARCHIVE,
                MarkAsRead: true,
            });
        });

        it('Should return the values for MoveToTrash when applying to future', () => {
            const resultFuture = getFilterData('MoveToTrash', simpleSubscription, true);
            expect(resultFuture).toEqual({
                ApplyTo: 'All',
                DestinationFolder: MAILBOX_LABEL_IDS.TRASH,
                MarkAsRead: false,
            });
        });

        it('Should return the values for MoveToTrash when applying to existing', () => {
            const resultExisting = getFilterData('MoveToTrash', simpleSubscription, false);
            expect(resultExisting).toEqual({
                ApplyTo: 'Existing',
                DestinationFolder: MAILBOX_LABEL_IDS.TRASH,
                MarkAsRead: false,
            });
        });

        it('Should return the values for MoveToTrash when applying to existing and read', () => {
            const resultExistingRead = getFilterData('MoveToTrash', { ...simpleSubscription, MarkAsRead: true }, false);
            expect(resultExistingRead).toEqual({
                ApplyTo: 'Existing',
                DestinationFolder: MAILBOX_LABEL_IDS.TRASH,
                MarkAsRead: true,
            });
        });
    });

    describe('getSubscriptionMoveToFolderName', () => {
        it('Should return the name of the custom folder', () => {
            const result = getSubscriptionMoveToFolderName(simpleFolders, 'testing');

            expect(result).toBe('testing');
        });

        it('Should return the undefined if not in custom folder', () => {
            const result = getSubscriptionMoveToFolderName(simpleFolders, 'other folder');

            expect(result).toBe(undefined);
        });

        it('Should return archive when moving to archive', () => {
            const result = getSubscriptionMoveToFolderName(simpleFolders, MAILBOX_LABEL_IDS.ARCHIVE);

            expect(result).toBe('Archive');
        });

        it('Should return trash when moving to trash', () => {
            const result = getSubscriptionMoveToFolderName(simpleFolders, MAILBOX_LABEL_IDS.TRASH);

            expect(result).toBe('Trash');
        });
    });

    describe('getUnsubscribeData', () => {
        it('Should return the data when only marking as read', () => {
            const result = getUnsubscribeData({ trash: false, archive: false, read: true });
            expect(result).toEqual({
                ApplyTo: 'All',
                MarkAsRead: true,
            });
        });

        it('Should return the data when only trashing', () => {
            const result = getUnsubscribeData({ trash: true, archive: false, read: false });
            expect(result).toEqual({
                ApplyTo: 'All',
                MarkAsRead: false,
                DestinationFolder: MAILBOX_LABEL_IDS.TRASH,
            });
        });

        it('Should return the data when only archiving', () => {
            const result = getUnsubscribeData({ trash: false, archive: true, read: false });
            expect(result).toEqual({
                ApplyTo: 'All',
                MarkAsRead: false,
                DestinationFolder: MAILBOX_LABEL_IDS.ARCHIVE,
            });
        });

        it('Should return the data when marking as read and trashing', () => {
            const result = getUnsubscribeData({ trash: true, archive: false, read: true });
            expect(result).toEqual({
                ApplyTo: 'All',
                MarkAsRead: true,
                DestinationFolder: MAILBOX_LABEL_IDS.TRASH,
            });
        });
    });

    describe('shouldOpenUpsellOnFilterClick', () => {
        describe('Free users', () => {
            const sub = {} as NewsletterSubscription;
            const freeUser = { hasPaidMail: false } as UserModel;

            it('Should be false when the user has no filter', () => {
                expect(shouldOpenUpsellOnFilterClick(sub, freeUser, [])).toBe(false);
            });

            it('Should be false when the user has on disabled filter', () => {
                expect(
                    shouldOpenUpsellOnFilterClick(sub, freeUser, [{ Status: FILTER_STATUS.DISABLED } as Filter])
                ).toBe(false);
            });

            it('Should be true when the user has on enabled filter', () => {
                expect(
                    shouldOpenUpsellOnFilterClick(sub, freeUser, [{ Status: FILTER_STATUS.ENABLED } as Filter])
                ).toBe(true);
            });

            it('Should be false when the user has one enabled filter on one subscription', () => {
                expect(
                    shouldOpenUpsellOnFilterClick({ FilterID: 'ID' } as NewsletterSubscription, freeUser, [
                        { ID: 'ID', Status: FILTER_STATUS.ENABLED } as Filter,
                    ])
                ).toBe(false);
            });

            it('Should be false when the user has one disabled filter on one subscription', () => {
                expect(
                    shouldOpenUpsellOnFilterClick({ FilterID: 'ID' } as NewsletterSubscription, freeUser, [
                        { ID: 'ID', Status: FILTER_STATUS.DISABLED } as Filter,
                    ])
                ).toBe(false);
            });
        });
        describe('Paid users', () => {
            const sub = {} as NewsletterSubscription;
            const paidUser = { hasPaidMail: true } as UserModel;

            it('Should be false when the user has no filter', () => {
                expect(shouldOpenUpsellOnFilterClick(sub, paidUser, [])).toBe(false);
            });

            it('Should be false when the user has one disabled filter', () => {
                expect(
                    shouldOpenUpsellOnFilterClick(sub, paidUser, [{ Status: FILTER_STATUS.DISABLED } as Filter])
                ).toBe(false);
            });

            it('Should be false when the user has two enabled filter', () => {
                expect(
                    shouldOpenUpsellOnFilterClick(sub, paidUser, [
                        { Status: FILTER_STATUS.ENABLED } as Filter,
                        { Status: FILTER_STATUS.ENABLED } as Filter,
                    ])
                ).toBe(false);
            });

            it('Should be false when the user has one enabled filter on one subscription', () => {
                expect(
                    shouldOpenUpsellOnFilterClick({ FilterID: 'ID' } as NewsletterSubscription, paidUser, [
                        { ID: 'ID', Status: FILTER_STATUS.ENABLED } as Filter,
                    ])
                ).toBe(false);
            });

            it('Should be false when the user has one enabled filter on one subscription', () => {
                expect(
                    shouldOpenUpsellOnFilterClick({ FilterID: 'ID' } as NewsletterSubscription, paidUser, [
                        { ID: 'ID', Status: FILTER_STATUS.ENABLED } as Filter,
                        { ID: 'ID2', Status: FILTER_STATUS.ENABLED } as Filter,
                        { ID: 'ID3', Status: FILTER_STATUS.ENABLED } as Filter,
                    ])
                ).toBe(false);
            });
        });
    });
});

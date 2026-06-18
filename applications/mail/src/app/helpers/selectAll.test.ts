import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';
import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';
import generateUID from '@proton/utils/generateUID';

import {
    getCanDisplaySelectAllBanner,
    getSelectAllBannerText,
    getSelectAllBannerTextWithLocation,
    getSelectAllButtonText,
    getSelectAllNotificationText,
} from 'proton-mail/helpers/selectAll';

const customLabelID = 'customLabelID';
const customLabelName = 'Custom Label';

const customLabels: Label[] = [
    { ID: customLabelID, Name: customLabelName } as Label,
    { ID: 'otherLabel', Name: 'Other Label' } as Label,
];

const customFolderID = 'customFolderID';
const customFolderName = 'Custom Folder';
const customFolders: Folder[] = [
    { ID: customFolderID, Name: customFolderName } as Folder,
    { ID: 'otherFolder', Name: 'Other Folder' } as Folder,
];

const elementsCount = 250;

describe('selectAll', () => {
    describe('getSelectAllBannerText', () => {
        it('should return the expected text', () => {
            expect(getSelectAllBannerText(false, elementsCount)).toEqual(`You selected **${elementsCount} messages**.`);
            expect(getSelectAllBannerText(true, elementsCount)).toEqual(
                `You selected **${elementsCount} conversations**.`
            );
        });
    });

    describe('getSelectAllBannerTextWithLocation', () => {
        describe('conversation mode off', () => {
            it('should return inbox folder name', () => {
                const res = getSelectAllBannerTextWithLocation({
                    conversationMode: false,
                    currentLabel: MAILBOX_LABEL_IDS.INBOX,
                    elementsCount,
                    customLabels,
                    customFolders,
                });

                expect(res).toEqual(`You selected **${elementsCount} messages** in Inbox`);
            });

            it('should return the category name', () => {
                const res = getSelectAllBannerTextWithLocation({
                    conversationMode: false,
                    currentLabel: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                    elementsCount,
                    customLabels,
                    customFolders,
                });

                expect(res).toEqual(`You selected **${elementsCount} messages** in Newsletters`);
            });

            it('should return the custom folder name', () => {
                const res = getSelectAllBannerTextWithLocation({
                    conversationMode: false,
                    currentLabel: customFolderID,
                    elementsCount,
                    customLabels,
                    customFolders,
                });

                expect(res).toEqual(`You selected **${elementsCount} messages** in Custom Folder`);
            });

            it('should return the custom label name', () => {
                const res = getSelectAllBannerTextWithLocation({
                    conversationMode: false,
                    currentLabel: customLabelID,
                    elementsCount,
                    customLabels,
                    customFolders,
                });

                expect(res).toEqual(`You selected **${elementsCount} messages** in Custom Label`);
            });
        });

        describe('conversation mode on', () => {
            it('should return inbox folder name', () => {
                const res = getSelectAllBannerTextWithLocation({
                    conversationMode: true,
                    currentLabel: MAILBOX_LABEL_IDS.INBOX,
                    elementsCount,
                    customLabels,
                    customFolders,
                });

                expect(res).toEqual(`You selected **${elementsCount} conversations** in Inbox`);
            });

            it('should return the category name', () => {
                const res = getSelectAllBannerTextWithLocation({
                    conversationMode: true,
                    currentLabel: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                    elementsCount,
                    customLabels,
                    customFolders,
                });

                expect(res).toEqual(`You selected **${elementsCount} conversations** in Newsletters`);
            });

            it('should return the custom folder name', () => {
                const res = getSelectAllBannerTextWithLocation({
                    conversationMode: true,
                    currentLabel: customFolderID,
                    elementsCount,
                    customLabels,
                    customFolders,
                });

                expect(res).toEqual(`You selected **${elementsCount} conversations** in Custom Folder`);
            });

            it('should return the custom label name', () => {
                const res = getSelectAllBannerTextWithLocation({
                    conversationMode: true,
                    currentLabel: customLabelID,
                    elementsCount,
                    customLabels,
                    customFolders,
                });

                expect(res).toEqual(`You selected **${elementsCount} conversations** in Custom Label`);
            });
        });
    });

    describe('getSelectAllButtonText', () => {
        describe('select all on', () => {
            it('should return inbox button text', () => {
                const res = getSelectAllButtonText({
                    selectAll: false,
                    currentLabel: MAILBOX_LABEL_IDS.INBOX,
                    elementsCount,
                    customLabels,
                    customFolders,
                });

                expect(res).toEqual(`Select all ${elementsCount} in Inbox`);
            });

            it('should return newsletters button text', () => {
                const res = getSelectAllButtonText({
                    selectAll: false,
                    currentLabel: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                    elementsCount,
                    customLabels,
                    customFolders,
                });

                expect(res).toEqual(`Select all ${elementsCount} in Newsletters`);
            });

            it('should return custom label button text', () => {
                const res = getSelectAllButtonText({
                    selectAll: false,
                    currentLabel: customLabelID,
                    elementsCount,
                    customLabels,
                    customFolders,
                });

                expect(res).toEqual(`Select all ${elementsCount} in Custom Label`);
            });

            it('should return custom folder button text', () => {
                const res = getSelectAllButtonText({
                    selectAll: false,
                    currentLabel: customFolderID,
                    elementsCount,
                    customLabels,
                    customFolders,
                });

                expect(res).toEqual(`Select all ${elementsCount} in Custom Folder`);
            });
        });

        describe('select all off', () => {
            it('should return clear selection copy', () => {
                const res = getSelectAllButtonText({
                    selectAll: true,
                    currentLabel: customLabelID,
                    elementsCount,
                    customLabels,
                    customFolders,
                });

                expect(res).toEqual('Clear selection');
            });
        });
    });

    describe('getSelectAllNotificationText', () => {
        it('should return the expected text', () => {
            expect(getSelectAllNotificationText(true)).toEqual('Applying actions to messages');
            expect(getSelectAllNotificationText(false)).toEqual('Applying actions to conversations');
        });
    });

    describe('getCanDisplaySelectAllBanner', () => {
        const generateIDs = (numberOfIds: number) => {
            const ids = [];
            for (let i = 0; i < numberOfIds; i++) {
                ids.push(generateUID());
            }

            return ids;
        };

        it('should show the select all banner', () => {
            expect(
                getCanDisplaySelectAllBanner({
                    mailPageSize: MAIL_PAGE_SIZE.FIFTY,
                    checkedIDs: generateIDs(MAIL_PAGE_SIZE.FIFTY),
                    currentLabel: MAILBOX_LABEL_IDS.INBOX,
                    isSearch: false,
                    hasFilter: false,
                })
            ).toBeTruthy();

            expect(
                getCanDisplaySelectAllBanner({
                    mailPageSize: MAIL_PAGE_SIZE.TWO_HUNDRED,
                    checkedIDs: generateIDs(MAIL_PAGE_SIZE.TWO_HUNDRED),
                    currentLabel: 'customLabelID',
                    isSearch: false,
                    hasFilter: false,
                })
            ).toBeTruthy();
        });

        it('should not show the select all banner when not enough checked ids', () => {
            expect(
                getCanDisplaySelectAllBanner({
                    mailPageSize: MAIL_PAGE_SIZE.FIFTY,
                    checkedIDs: generateIDs(MAIL_PAGE_SIZE.FIFTY - 1),
                    currentLabel: MAILBOX_LABEL_IDS.INBOX,
                    isSearch: false,
                    hasFilter: false,
                })
            ).toBeFalsy();
        });

        it('should not show the select all banner in all mail and almost all mail', () => {
            expect(
                getCanDisplaySelectAllBanner({
                    mailPageSize: MAIL_PAGE_SIZE.FIFTY,
                    checkedIDs: generateIDs(MAIL_PAGE_SIZE.FIFTY),
                    currentLabel: MAILBOX_LABEL_IDS.ALL_MAIL,
                    isSearch: false,
                    hasFilter: false,
                })
            ).toBeFalsy();

            expect(
                getCanDisplaySelectAllBanner({
                    mailPageSize: MAIL_PAGE_SIZE.FIFTY,
                    checkedIDs: generateIDs(MAIL_PAGE_SIZE.FIFTY),
                    currentLabel: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    isSearch: false,
                    hasFilter: false,
                })
            ).toBeFalsy();
        });

        it('should not show the select all banner in search', () => {
            expect(
                getCanDisplaySelectAllBanner({
                    mailPageSize: MAIL_PAGE_SIZE.FIFTY,
                    checkedIDs: generateIDs(MAIL_PAGE_SIZE.FIFTY),
                    currentLabel: MAILBOX_LABEL_IDS.INBOX,
                    isSearch: true,
                    hasFilter: false,
                })
            ).toBeFalsy();
        });

        it('should not show the select all banner in filter', () => {
            expect(
                getCanDisplaySelectAllBanner({
                    mailPageSize: MAIL_PAGE_SIZE.FIFTY,
                    checkedIDs: generateIDs(MAIL_PAGE_SIZE.FIFTY),
                    currentLabel: MAILBOX_LABEL_IDS.INBOX,
                    isSearch: false,
                    hasFilter: true,
                })
            ).toBeFalsy();
        });
    });
});

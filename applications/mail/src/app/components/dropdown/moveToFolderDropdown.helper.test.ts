import { CATEGORIES_COLOR_SHADES } from '@proton/mail';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { getInboxCategoriesItems } from './moveToFolderDropdown.helper';

describe('MoveToFolderDropdownHelper', () => {
    describe('getInboxCategoriesItems', () => {
        it('should return an empty array if we cannot move to inbox', () => {
            expect(
                getInboxCategoriesItems({
                    canMoveToInbox: false,
                    shouldShowTabs: false,
                    activeCategoriesTabs: [],
                })
            ).toEqual([]);
        });

        it('should return inbox if cannot move to tab even if we have active categories', () => {
            const res = getInboxCategoriesItems({
                canMoveToInbox: true,
                shouldShowTabs: false,
                activeCategoriesTabs: [
                    {
                        id: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                        colorShade: CATEGORIES_COLOR_SHADES.IRIS,
                        outlinedIcon: 'inbox',
                        filledIcon: 'inbox-filled',
                    },
                    {
                        id: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                        colorShade: CATEGORIES_COLOR_SHADES.TEAL,
                        outlinedIcon: 'megaphone',
                        filledIcon: 'megaphone-filled',
                    },
                ],
            });

            expect(res).toEqual([
                {
                    ID: MAILBOX_LABEL_IDS.INBOX,
                    Name: 'Inbox',
                    icon: 'inbox',
                },
            ]);
        });

        it('should return the active categories', () => {
            const res = getInboxCategoriesItems({
                canMoveToInbox: true,
                shouldShowTabs: true,
                activeCategoriesTabs: [
                    {
                        id: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                        colorShade: CATEGORIES_COLOR_SHADES.IRIS,
                        outlinedIcon: 'inbox',
                        filledIcon: 'inbox-filled',
                    },
                    {
                        id: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                        colorShade: CATEGORIES_COLOR_SHADES.TEAL,
                        outlinedIcon: 'megaphone',
                        filledIcon: 'megaphone-filled',
                    },
                ],
            });

            expect(res.length).toEqual(2);
            expect(res[0].ID).toEqual(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT);
            expect(res[1].ID).toEqual(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS);
        });
    });
});

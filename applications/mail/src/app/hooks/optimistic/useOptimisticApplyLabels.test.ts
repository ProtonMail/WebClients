import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';

import { getIsElementMovingOutFromLabel } from 'proton-mail/hooks/optimistic/useOptimisticApplyLabels';

describe('useOptimisticApplyLabels', () => {
    describe('getIsElementMovingOutFromLabel', () => {
        const customLabels: Label[] = [
            { ID: 'customLabel1', Name: 'custom label 1' } as Label,
            { ID: 'customLabel2', Name: 'custom label 2' } as Label,
        ];

        it('should be elements that will be moved out from the current label', () => {
            // Move an item from INBOX to TRASH
            expect(
                getIsElementMovingOutFromLabel({
                    currentLabelID: MAILBOX_LABEL_IDS.INBOX,
                    inputChanges: { [MAILBOX_LABEL_IDS.TRASH]: true },
                    labels: customLabels,
                })
            ).toBeTruthy();

            // Move an item from ALMOST_ALL_MAIL to TRASH
            expect(
                getIsElementMovingOutFromLabel({
                    currentLabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    inputChanges: { [MAILBOX_LABEL_IDS.TRASH]: true },
                    labels: customLabels,
                })
            ).toBeTruthy();

            // Move an item from ALMOST_ALL_MAIL to SPAM
            expect(
                getIsElementMovingOutFromLabel({
                    currentLabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    inputChanges: { [MAILBOX_LABEL_IDS.SPAM]: true },
                    labels: customLabels,
                })
            ).toBeTruthy();

            // Move an item from a custom label to TRASH
            expect(
                getIsElementMovingOutFromLabel({
                    currentLabelID: customLabels[0].ID,
                    inputChanges: { [MAILBOX_LABEL_IDS.TRASH]: true },
                    labels: customLabels,
                })
            ).toBeTruthy();

            // Move an item from a custom label to SPAM
            expect(
                getIsElementMovingOutFromLabel({
                    currentLabelID: customLabels[0].ID,
                    inputChanges: { [MAILBOX_LABEL_IDS.SPAM]: true },
                    labels: customLabels,
                })
            ).toBeTruthy();
        });

        it('should be elements that will be stay in the current label', () => {
            // currentLabelID is undefined
            expect(
                getIsElementMovingOutFromLabel({
                    currentLabelID: undefined,
                    inputChanges: { [MAILBOX_LABEL_IDS.INBOX]: true },
                    labels: customLabels,
                })
            ).toBeFalsy();

            // Move an item from ALMOST_ALL_MAIL to ARCHIVE
            expect(
                getIsElementMovingOutFromLabel({
                    currentLabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    inputChanges: { [MAILBOX_LABEL_IDS.ARCHIVE]: true },
                    labels: customLabels,
                })
            ).toBeFalsy();

            // Move an item from custom label to INBOX
            expect(
                getIsElementMovingOutFromLabel({
                    currentLabelID: customLabels[0].ID,
                    inputChanges: { [MAILBOX_LABEL_IDS.INBOX]: true },
                    labels: customLabels,
                })
            ).toBeFalsy();

            // Move an item from ALL_MAIL to INBOX
            expect(
                getIsElementMovingOutFromLabel({
                    currentLabelID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    inputChanges: { [MAILBOX_LABEL_IDS.INBOX]: true },
                    labels: customLabels,
                })
            ).toBeFalsy();

            // Move an item from ALL_MAIL to TRASH
            expect(
                getIsElementMovingOutFromLabel({
                    currentLabelID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    inputChanges: { [MAILBOX_LABEL_IDS.TRASH]: true },
                    labels: customLabels,
                })
            ).toBeFalsy();

            // Move an item from ALL_MAIL to SPAM
            expect(
                getIsElementMovingOutFromLabel({
                    currentLabelID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    inputChanges: { [MAILBOX_LABEL_IDS.SPAM]: true },
                    labels: customLabels,
                })
            ).toBeFalsy();

            // Move an item from ALL_SENT to customLabel
            expect(
                getIsElementMovingOutFromLabel({
                    currentLabelID: MAILBOX_LABEL_IDS.ALL_SENT,
                    inputChanges: { [customLabels[0].ID]: true },
                    labels: customLabels,
                })
            ).toBeFalsy();

            // Move an item from ALL_SENT to TRASH
            expect(
                getIsElementMovingOutFromLabel({
                    currentLabelID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    inputChanges: { [MAILBOX_LABEL_IDS.TRASH]: true },
                    labels: customLabels,
                })
            ).toBeFalsy();

            // Move an item from ALL_DRAFTS to customLabel
            expect(
                getIsElementMovingOutFromLabel({
                    currentLabelID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                    inputChanges: { [customLabels[0].ID]: true },
                    labels: customLabels,
                })
            ).toBeFalsy();

            // Move an item from ALL_DRAFTS to TRASH
            expect(
                getIsElementMovingOutFromLabel({
                    currentLabelID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                    inputChanges: { [MAILBOX_LABEL_IDS.TRASH]: true },
                    labels: customLabels,
                })
            ).toBeFalsy();
        });
    });
});

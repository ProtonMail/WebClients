import { screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';

import { getElementContextIdentifier } from '../../helpers/elements';
import { mailTestRender } from '../../helpers/test/helper';
import { newElementsState } from '../../store/elements/elementsSlice';
import SelectionPane from './SelectionPane';

describe('SelectionPane', () => {
    const defaultMailSettings = DEFAULT_MAIL_SETTINGS as MailSettings;
    const location = createMemoryHistory().location;
    const onCheckAll = jest.fn();

    const getContextKey = (labelID: string) => {
        const elementsState = newElementsState({ params: { labelID } });
        return getElementContextIdentifier({
            labelID: elementsState.params.labelID,
            categoryIDs: elementsState.params.categoryIDs,
            conversationMode: elementsState.params.conversationMode,
            filter: elementsState.params.filter,
            sort: elementsState.params.sort,
            from: elementsState.params.search.from,
            to: elementsState.params.search.to,
            address: elementsState.params.search.address,
            begin: elementsState.params.search.begin,
            end: elementsState.params.search.end,
            keyword: elementsState.params.search.keyword,
            newsletterSubscriptionID: elementsState.params.newsletterSubscriptionID,
        });
    };

    it('should not show "No messages found" while still loading (before first API response)', async () => {
        const labelID = MAILBOX_LABEL_IDS.INBOX;

        await mailTestRender(
            <SelectionPane
                labelID={labelID}
                mailSettings={defaultMailSettings}
                location={location}
                onCheckAll={onCheckAll}
            />,
            {
                preloadedState: {
                    elements: {
                        ...newElementsState({ params: { labelID } }),
                        // beforeFirstLoad: true (default) means the API hasn't responded yet
                    },
                },
            }
        );

        expect(screen.queryByText('No messages found')).toBeNull();
    });

    it('should show "No messages found" after API confirms the location is empty', async () => {
        const labelID = MAILBOX_LABEL_IDS.INBOX;
        const contextKey = getContextKey(labelID);

        await mailTestRender(
            <SelectionPane
                labelID={labelID}
                mailSettings={defaultMailSettings}
                location={location}
                onCheckAll={onCheckAll}
            />,
            {
                preloadedState: {
                    elements: {
                        ...newElementsState({ params: { labelID }, beforeFirstLoad: false }),
                        pendingRequest: false,
                        total: { [contextKey]: 0 },
                    },
                },
            }
        );

        expect(screen.getByText('No messages found')).toBeInTheDocument();
    });

    it('should not show "No messages found" while a request is pending', async () => {
        const labelID = MAILBOX_LABEL_IDS.INBOX;
        const contextKey = getContextKey(labelID);

        await mailTestRender(
            <SelectionPane
                labelID={labelID}
                mailSettings={defaultMailSettings}
                location={location}
                onCheckAll={onCheckAll}
            />,
            {
                preloadedState: {
                    elements: {
                        ...newElementsState({ params: { labelID }, beforeFirstLoad: false }),
                        pendingRequest: true,
                        total: { [contextKey]: 0 },
                    },
                },
            }
        );

        expect(screen.queryByText('No messages found')).toBeNull();
    });

    it('should show label name while loading instead of "No messages found"', async () => {
        const labelID = MAILBOX_LABEL_IDS.INBOX;

        await mailTestRender(
            <SelectionPane
                labelID={labelID}
                mailSettings={defaultMailSettings}
                location={location}
                onCheckAll={onCheckAll}
            />,
            {
                preloadedState: {
                    elements: {
                        ...newElementsState({ params: { labelID } }),
                        // beforeFirstLoad: true (default)
                    },
                },
            }
        );

        expect(screen.getByText('Inbox')).toBeInTheDocument();
    });

    it('should always render the description paragraph to prevent layout shift', async () => {
        const labelID = MAILBOX_LABEL_IDS.INBOX;

        await mailTestRender(
            <SelectionPane
                labelID={labelID}
                mailSettings={defaultMailSettings}
                location={location}
                onCheckAll={onCheckAll}
            />,
            {
                preloadedState: {
                    elements: {
                        ...newElementsState({ params: { labelID } }),
                        // beforeFirstLoad: true (default) — no text content yet
                    },
                },
            }
        );

        const paragraph = screen.getByTestId('section-pane--wrapper').querySelector('p');
        expect(paragraph).toBeInTheDocument();
    });
});

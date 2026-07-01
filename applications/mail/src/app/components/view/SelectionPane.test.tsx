import { screen } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { SearchParameters } from '@proton/shared/lib/mail/search';

import { getElementContextIdentifier } from '../../helpers/elements';
import { mailTestRender } from '../../helpers/test/helper';
import { newElementsState } from '../../store/elements/elementsSlice';
import SelectionPane from './SelectionPane';

describe('SelectionPane', () => {
    const onCheckAll = jest.fn();

    const getContextKey = (labelID: string, search: SearchParameters = {}) => {
        const elementsState = newElementsState({ params: { labelID, search } });
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

    it('should show "Inbox" after API confirms the location is empty', async () => {
        const labelID = MAILBOX_LABEL_IDS.INBOX;
        const contextKey = getContextKey(labelID);

        await mailTestRender(<SelectionPane labelID={labelID} onCheckAll={onCheckAll} />, {
            preloadedState: {
                elements: {
                    ...newElementsState({ params: { labelID }, beforeFirstLoad: false }),
                    pendingRequest: false,
                    total: { [contextKey]: 0 },
                },
            },
        });

        expect(screen.getByText('Inbox')).toBeInTheDocument();
    });

    it('should show the search result count and not the location count', async () => {
        const labelID = MAILBOX_LABEL_IDS.INBOX;
        const search: SearchParameters = { keyword: 'single' };
        const contextKey = getContextKey(labelID, search);

        await mailTestRender(<SelectionPane labelID={labelID} onCheckAll={onCheckAll} />, {
            initialPath: '/inbox#keyword=single',
            preloadedState: {
                // The location holds 2 conversations. Before the fix, the pane read this count.
                conversationCounts: getModelState([{ LabelID: labelID, Total: 2, Unread: 0 }]),
                elements: {
                    ...newElementsState({ params: { labelID, search }, beforeFirstLoad: false }),
                    pendingRequest: false,
                    // The search context only returned 1 result.
                    total: { [contextKey]: 1 },
                },
            },
        });

        expect(screen.getByTestId('section-pane--wrapper')).toHaveTextContent('1 result found in Inbox');
    });

    it('should show label name while loading instead of "No messages found"', async () => {
        const labelID = MAILBOX_LABEL_IDS.INBOX;

        await mailTestRender(<SelectionPane labelID={labelID} onCheckAll={onCheckAll} />, {
            preloadedState: {
                elements: {
                    ...newElementsState({ params: { labelID } }),
                },
            },
        });

        expect(screen.getByText('Inbox')).toBeInTheDocument();
    });

    it('should show the empty category copy when an active category has no messages', async () => {
        const labelID = MAILBOX_LABEL_IDS.INBOX;

        await mailTestRender(<SelectionPane labelID={labelID} onCheckAll={onCheckAll} />, {
            preloadedState: {
                elements: {
                    ...newElementsState({
                        params: { labelID, categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL] },
                        beforeFirstLoad: false,
                    }),
                    pendingRequest: false,
                },
            },
        });

        // The default mail settings render in conversation mode
        expect(screen.getByText('You have no conversations in this category')).toBeInTheDocument();
    });

    it('should always render the description paragraph to prevent layout shift', async () => {
        const labelID = MAILBOX_LABEL_IDS.INBOX;

        await mailTestRender(<SelectionPane labelID={labelID} onCheckAll={onCheckAll} />, {
            preloadedState: {
                elements: {
                    ...newElementsState({ params: { labelID } }),
                },
            },
        });

        const paragraph = screen.getByTestId('section-pane--wrapper').querySelector('p');
        expect(paragraph).toBeInTheDocument();
    });
});

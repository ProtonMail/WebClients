import { screen } from '@testing-library/react';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { getElementContextIdentifier } from '../../helpers/elements';
import { mailTestRender } from '../../helpers/test/helper';
import { newElementsState } from '../../store/elements/elementsSlice';
import SelectionPane from './SelectionPane';

describe('SelectionPane', () => {
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

import { act, waitFor } from '@testing-library/react';

import { EVENT_ACTIONS } from '@proton/shared/lib/constants';

import { clearAll } from '../../../helpers/test/helper';
import * as useStarModule from '../../../hooks/actions/useStar';
import { getElements, props, sendEvent, setup } from './Mailbox.test.helpers';

jest.spyOn(useStarModule, 'useStar');

jest.mock('proton-mail/metrics/useMailELDTMetric', () => ({
    useMailELDTMetric: () => {
        return { stopELDTMetric: jest.fn() };
    },
}));

// Spying useStar is a trick to count the number of renders on the component ItemStar
// Beware, useStar is also used on the hotkeys management
const useStar = useStarModule.useStar as jest.Mock;

describe('Mailbox performance loss check', () => {
    beforeEach(clearAll);

    /**
     * ItemStar is a pretext to detect item re-rendering
     * The point of this test is to trigger some common event on the app like an element update event and a location change
     * Count the number of render of the ItemStar component which is present inside each line of the element list
     * And verify that this low level component has never been re-rerendered
     * We're spying on the useStar hook to count the number of render
     */
    it('should not render ItemStar on a conversation events nor a location change', async () => {
        const { labelID } = props;
        const total = 3;
        const SomeNonMatchingID = 'SomeNonMatchingID';

        const conversations = getElements(total, labelID);
        const { getItems, store, history } = await setup({ conversations });
        const items = getItems();

        expect(items.length).toBe(total);

        const callsAfterInitialization = useStar.mock.calls.length;

        // Send event though the event manager + change location to trigger common app change
        await sendEvent(store, {
            Conversations: [
                {
                    ID: SomeNonMatchingID,
                    Action: EVENT_ACTIONS.CREATE,
                    Conversation: {
                        ID: SomeNonMatchingID,
                    },
                },
            ],
        });

        act(() => {
            history.push('/sent');
        });

        await waitFor(() => {
            // There will be a few more calls, but it has to be in limited amount
            expect(useStar.mock.calls.length).toBeLessThan(callsAfterInitialization + 15);
        });
    });
});

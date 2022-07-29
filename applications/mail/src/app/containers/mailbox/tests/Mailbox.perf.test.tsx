import { EVENT_ACTIONS } from '@proton/shared/lib/constants';

import { clearAll, getHistory } from '../../../helpers/test/helper';
import * as useApplyLabels from '../../../hooks/useApplyLabels';
import { getElements, sendEvent, setup } from './Mailbox.test.helpers';

jest.spyOn(useApplyLabels, 'useStar');

// Spying useStar is a trick to count the number of renders on the component ItemStar
// Beware, useStar is also used on the hotkeys management
const useStar = useApplyLabels.useStar as jest.Mock;

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
        const total = 3;
        const SomeNonMatchingID = 'SomeNonMatchingID';

        const conversations = getElements(total);
        const { getItems } = await setup({ conversations });
        const items = getItems();

        expect(items.length).toBe(total);

        const callsAfterInitialization = useStar.mock.calls.length;

        // Send event though the event manager + change location to trigger common app change
        await sendEvent({
            Conversations: [
                { ID: SomeNonMatchingID, Action: EVENT_ACTIONS.CREATE, Conversation: { ID: SomeNonMatchingID } },
            ],
        });
        getHistory().push('/elsewhere');

        // There will be a few more call but it has to be in limited amount
        expect(useStar.mock.calls.length).toBeLessThan(callsAfterInitialization + 6);
    });
});

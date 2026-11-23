import { fireEvent, screen, waitFor, within } from '@testing-library/react';

import type { RecipientGroup } from '@proton/mail-message/models/address';
import type { ContactGroup } from '@proton/shared/lib/interfaces/contacts/Contact';

import { clearAll } from '../../../../helpers/tests/helper';
import { mailTestRender, tick } from '../../../../helpers/tests/render';
import RecipientItemGroup from '../RecipientItemGroup';

const group: RecipientGroup = {
    group: { ID: 'group-id', Name: 'Team' } as ContactGroup,
    recipients: [{ Name: 'Alice', Address: 'alice@proton.me', Group: 'Team' }],
};

describe('RecipientItemGroup', () => {
    afterEach(clearAll);

    it('should open and close the group recipients modal', async () => {
        await mailTestRender(<RecipientItemGroup group={group} customDataTestId="recipient:group" />);

        fireEvent.click(screen.getByTestId('recipient:group'));
        await tick();
        fireEvent.click(screen.getByTestId('recipient:view-group-recipients'));

        const modal = (await screen.findByText('Team (0 Members)')).closest('.modal-two') as HTMLElement;

        fireEvent.click(within(modal).getByText('Close', { selector: 'button' }));
        await waitFor(() => expect(document.querySelector('.modal-two--out')).toBeInTheDocument());
    });
});

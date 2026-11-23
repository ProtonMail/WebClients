import { getModelState } from '@proton/account/testing/getModelState';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact';

import { clearAll, minimalCache, renderWithProviders } from '../tests/vitest/render';
import ContactSelectorModal from './ContactSelectorModal';

describe('ContactSelectorModal', () => {
    beforeEach(clearAll);

    it('opens with a non-empty list when a contact belongs to a deleted group', () => {
        minimalCache();
        const contactEmail = {
            ID: 'ContactEmail1',
            Email: 'alice@test.com',
            Name: 'Alice',
            ContactID: 'ContactID',
            LabelIDs: ['DeletedGroupID'],
            Order: 1,
        } as ContactEmail;

        const { getByRole } = renderWithProviders(
            <ContactSelectorModal
                open
                inputValue={[]}
                onResolve={vi.fn()}
                onReject={vi.fn()}
                onGroupDetails={vi.fn()}
                onEdit={vi.fn()}
            />,
            {
                preloadedState: {
                    contactEmails: getModelState([contactEmail]),
                    categories: getModelState([]),
                },
            }
        );

        expect(getByRole('checkbox', { name: '' })).toBeInTheDocument();
    });
});

import { render, screen } from '@testing-library/react';

import { GROUP_MEMBERSHIP_STATUS, type GroupMembership } from '@proton/shared/lib/interfaces/GroupMember';

import GroupState from './GroupState';

const getMembership = (Status: GROUP_MEMBERSHIP_STATUS): GroupMembership => ({
    Name: 'Sales',
    Address: 'sales@example.com',
    Status,
    Keys: { PrivateKey: '', ActivationToken: '' },
    AddressID: 'address-id',
    ID: 'membership-id',
    Permissions: 0,
});

describe('GroupState', () => {
    it('puts the test id on the pill of the current status only', () => {
        const { rerender } = render(<GroupState membership={getMembership(GROUP_MEMBERSHIP_STATUS.UNANSWERED)} />);

        expect(screen.getByTestId('group-state')).toHaveTextContent('Unanswered');

        rerender(<GroupState membership={getMembership(GROUP_MEMBERSHIP_STATUS.ACTIVE)} />);

        expect(screen.getByTestId('group-state')).toHaveTextContent('Active');
    });
});

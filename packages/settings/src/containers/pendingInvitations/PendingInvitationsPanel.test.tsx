import { render, screen } from '@testing-library/react';

import { useGetUserInvitations } from '@proton/account/userInvitations/hooks';
import { pendingInvite } from '@proton/components/testing/subscriptionData';

import PendingInvitationsPanel from './PendingInvitationsPanel';

jest.mock('@proton/account/userInvitations/hooks');
const mockUseGetUserInvitations = useGetUserInvitations as jest.MockedFunction<any>;
mockUseGetUserInvitations.mockReturnValue(async () => []);

describe('PendingInvitationsPanel', () => {
    it('should list the pending invitations', () => {
        render(<PendingInvitationsPanel invites={[pendingInvite]} />);

        const invitePanel = screen.getByTestId('pending-invitations-panel');
        expect(invitePanel).toHaveTextContent('Pending invitation');
        expect(invitePanel).toHaveTextContent('Invitation from Test Org');
        expect(screen.getByRole('button', { name: 'View invitation' })).toBeInTheDocument();
    });

    it('should render nothing without invitations', () => {
        const { container } = render(<PendingInvitationsPanel invites={[]} />);

        expect(container).toBeEmptyDOMElement();
    });
});

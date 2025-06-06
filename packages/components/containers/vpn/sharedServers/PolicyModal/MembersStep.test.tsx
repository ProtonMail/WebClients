import { render, screen } from '@testing-library/react';

import { PLANS } from '@proton/payments';
import type { Organization } from '@proton/shared/lib/interfaces';

import MembersStep from './MembersStep';

describe('MembersStep', () => {
    const defaultProps = {
        isEditing: false,
        policyName: 'Test Policy',
        users: [],
        selectedUsers: [],
        groups: [],
        selectedGroups: [],
        onSelectUser: jest.fn(),
        onSelectGroup: jest.fn(),
        onSelectAllUsers: jest.fn(),
        onSelectAllGroups: jest.fn(),
        applyPolicyTo: 'users' as const,
        onChangeApplyPolicyTo: jest.fn(),
    };

    it('should not show policy-related divs when canCreateGroupsPolicy is false because VPN Professional', () => {
        const organization: Organization = {
            PlanName: PLANS.VPN_BUSINESS,
        } as Organization;

        render(<MembersStep {...defaultProps} organization={organization} />);

        // Check that "Apply policy to" text is not present
        expect(screen.queryByText('Apply policy to')).not.toBeInTheDocument();

        // Check that Users and Groups buttons are not present
        expect(document.getElementById('Users')).not.toBeInTheDocument();
        expect(document.getElementById('Groups')).not.toBeInTheDocument();
    });

    it('should not show policy-related divs when canCreateGroupsPolicy is false because VPN Essentials', () => {
        const organization: Organization = {
            PlanName: PLANS.VPN_PRO,
        } as Organization;

        render(<MembersStep {...defaultProps} organization={organization} />);

        // Check that "Apply policy to" text is not present
        expect(screen.queryByText('Apply policy to')).not.toBeInTheDocument();

        // Check that Users and Groups buttons are not present
        expect(document.getElementById('Users')).not.toBeInTheDocument();
        expect(document.getElementById('Groups')).not.toBeInTheDocument();
    });
});

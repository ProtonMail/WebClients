import { screen } from '@testing-library/react';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/subscriptionModalContext';
import useAssistantFeatureEnabled from '@proton/components/hooks/assistant/useAssistantFeatureEnabled';
import { renderWithProviders } from '@proton/components/testing/vitest/renderWithProviders';
import { CommonFeatureFlag, MailFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

import { AccessToggleScribe } from './AccessToggleScribe';

vi.mock('@proton/account/organization/hooks');
vi.mocked(useOrganization).mockReturnValue([{ Settings: { ShowScribeWritingAssistant: true } } as any, false]);

vi.mock('@proton/components/hooks/assistant/useAssistantFeatureEnabled');
vi.mocked(useAssistantFeatureEnabled).mockReturnValue({ paymentsEnabled: true } as any);

vi.mock('@proton/components/containers/payments/subscription/subscriptionModalContext');
vi.mocked(useSubscriptionModal).mockReturnValue([vi.fn(), false, true]);

vi.mock('@proton/unleash/useFlag');
const mockUseFlag = vi.mocked(useFlag);

describe('AccessToggleScribe', () => {
    const renderWithScribeToLumo = (scribeToLumo: boolean) => {
        mockUseFlag.mockImplementation(
            (flag) =>
                flag === CommonFeatureFlag.ScribeAdminSetting || (flag === MailFeatureFlag.ScribeToLumo && scribeToLumo)
        );
        renderWithProviders(<AccessToggleScribe />);
    };

    it('drops the add more seats link with ScribeToLumo on', () => {
        renderWithScribeToLumo(true);

        const link = screen.getByRole('link', { name: 'Users and addresses' });
        expect(link.nextSibling?.textContent).toBe('.');
        expect(link.nextSibling?.nextSibling).toBeNull();
        expect(screen.queryByText('add more seats')).not.toBeInTheDocument();
    });

    it('keeps the add more seats link with ScribeToLumo off', () => {
        renderWithScribeToLumo(false);

        expect(screen.getByText('Users and addresses')).toBeInTheDocument();
        expect(screen.getByText('add more seats')).toBeInTheDocument();
    });
});

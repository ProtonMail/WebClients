import { render } from '@testing-library/react';

import ProtonBadgeType from '@proton/components/components/protonBadge/ProtonBadgeType';
import type { Recipient } from '@proton/shared/lib/interfaces';

jest.mock('@proton/components/hooks/useFeature', () => jest.fn(() => ({ feature: { Value: true } })));

describe('ProtonBadgeType', () => {
    it('should show a verified badge', async () => {
        const verifiedRecipient: Recipient = {
            Name: 'Verified',
            Address: 'verified@pm.me',
            IsProton: 1,
        };

        const { getByTestId } = render(<ProtonBadgeType recipient={verifiedRecipient} />);

        getByTestId('proton-badge');
    });

    it('should not show a verified badge', async () => {
        const normalRecipient: Recipient = {
            Name: 'Normal',
            Address: 'normal@pm.me',
            IsProton: 0,
        };

        const { queryByTestId } = render(<ProtonBadgeType recipient={normalRecipient} />);

        const protonBadge = queryByTestId('proton-badge');
        expect(protonBadge).toBeNull();
    });
});

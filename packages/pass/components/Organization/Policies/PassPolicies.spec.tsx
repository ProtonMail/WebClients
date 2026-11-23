import { screen } from '@testing-library/react';

import type { FeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

import { usePassBridge } from '../../../lib/bridge/PassBridgeProvider';
import type { PassBridge } from '../../../lib/bridge/types';
import type { OrganizationGetResponse } from '../../../types/api/pass';
import { render } from '../../../utils/tests/render';
import PassPolicies from './PassPolicies';

vi.mock('@proton/unleash/useFlag', () => ({ useFlag: vi.fn() }));
vi.mock('../../../lib/bridge/PassBridgeProvider', () => ({ usePassBridge: vi.fn() }));

const organizationSettings = { CanUpdate: true, Settings: {} } as OrganizationGetResponse;

const enableFlags = (...enabledFlags: FeatureFlag[]) =>
    vi.mocked(useFlag).mockImplementation((flag) => enabledFlags.includes(flag));

const openPoliciesPage = async () => {
    vi.mocked(usePassBridge).mockReturnValue({
        organization: {
            settings: { get: vi.fn().mockResolvedValue(organizationSettings) },
            pauseList: { get: vi.fn().mockResolvedValue([]) },
        },
    } as unknown as PassBridge);

    render(<PassPolicies upgradeRequired={false} />);
    await screen.findByRole('checkbox', { name: /Allow sharing outside the organization/ });
};

const queryTotpPolicy = () => screen.queryByRole('checkbox', { name: /Allow storing 2FA codes/ });
const queryPasskeyPolicy = () => screen.queryByRole('checkbox', { name: /Allow storing passkeys/ });

describe('PassPolicies', () => {
    test('hides the 2FA and passkey policies when their flags are off', async () => {
        enableFlags();
        await openPoliciesPage();

        expect(queryTotpPolicy()).not.toBeInTheDocument();
        expect(queryPasskeyPolicy()).not.toBeInTheDocument();
    });

    test('shows only the 2FA policy when only its flag is on', async () => {
        enableFlags('PassPolicyStoreTotp');
        await openPoliciesPage();

        expect(queryTotpPolicy()).toBeInTheDocument();
        expect(queryPasskeyPolicy()).not.toBeInTheDocument();
    });

    test('shows only the passkey policy when only its flag is on', async () => {
        enableFlags('PassPolicyStorePasskey');
        await openPoliciesPage();

        expect(queryTotpPolicy()).not.toBeInTheDocument();
        expect(queryPasskeyPolicy()).toBeInTheDocument();
    });
});

import { fireEvent } from '@testing-library/react';
import type { MockedFunction } from 'vitest';

import { mockUseAddresses } from '@proton/account/testing/vitest/mockUseAddresses';
import { useUser } from '@proton/account/user/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { useGetMailSettings } from '@proton/mail/store/mailSettings/hooks';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { IncomingAddressForwarding } from '@proton/shared/lib/interfaces/AddressForwarding';
import { ForwardingState } from '@proton/shared/lib/interfaces/AddressForwarding';

import { applyHOCs } from '../../testing/hocs/helpers';
import { withApi } from '../../testing/vitest/with-api';
import { withEventManager } from '../../testing/vitest/with-event-manager';
import { withAuthentication } from '../../testing/with-authentication';
import { withCache } from '../../testing/with-cache';
import { withConfig } from '../../testing/with-config';
import { renderWithProviders } from '../contacts/tests/vitest/render';
import IncomingForwardActions from './IncomingForwardActions';

vi.mock('@proton/app-context/useApi');
const mockedUseApi = useApi as MockedFunction<typeof useApi>;

vi.mock('@proton/account/userKeys/hooks');
const mockUseGetUserKeys = useGetUserKeys as MockedFunction<any>;
mockUseGetUserKeys.mockReturnValue(vi.fn());

vi.mock('@proton/account/user/hooks');
const mockedUseUser = useUser as MockedFunction<typeof useUser>;
mockedUseUser.mockReturnValue([{}] as any);

mockUseAddresses();

vi.mock('@proton/app-context/useNotifications');
const mockUseNotifications = useNotifications as MockedFunction<any>;
mockUseNotifications.mockReturnValue({
    createNotification: vi.fn(),
});

vi.mock('@proton/mail/store/mailSettings/hooks');
const mockUseMailSettings = useGetMailSettings as MockedFunction<any>;
mockUseMailSettings.mockReturnValue(vi.fn());

const IncomingAddressForwardingContext = applyHOCs(
    withCache(),
    withApi(),
    withEventManager(),
    withConfig(),
    withAuthentication()
)(IncomingForwardActions);

describe('IncomingForwardActions', () => {
    const setup = ({ State = ForwardingState.Pending } = {}) => {
        const mockApi = vi.fn().mockImplementation(() => Promise.resolve({}));
        mockedUseApi.mockReturnValue(mockApi);
        const forward = {
            ID: 'id',
            ForwardeeAddressID: 'id',
            ForwarderEmail: 'email',
            ForwardingKeys: [
                {
                    PrivateKey: 'privateKey',
                    ActivationToken: 'token',
                },
            ],
            State,
        } as IncomingAddressForwarding;
        const addresses = [
            {
                ID: 'id',
                Email: 'email',
            },
        ] as Address[];
        const utils = renderWithProviders(<IncomingAddressForwardingContext forward={forward} addresses={addresses} />);
        fireEvent.click(utils.getByTitle('Open actions dropdown'));
        return { ...utils, forward, mockApi };
    };

    describe('when incoming forwarding is pending', () => {
        it('should show accept and decline buttons', () => {
            const { getByText } = setup();
            expect(getByText('Accept')).toBeInTheDocument();
            expect(getByText('Decline')).toBeInTheDocument();
        });
    });
});

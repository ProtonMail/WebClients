import { fireEvent } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { renderWithProviders } from '@proton/components/containers/contacts/tests/render';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useGetMailSettings } from '@proton/mail/store/mailSettings/hooks';
import type { Address, IncomingAddressForwarding } from '@proton/shared/lib/interfaces';
import { ForwardingState } from '@proton/shared/lib/interfaces';
import { applyHOCs, withApi, withAuthentication, withCache, withConfig, withEventManager } from '@proton/testing';
import { mockUseAddresses } from '@proton/testing/lib/mockUseAddresses';

import IncomingForwardActions from './IncomingForwardActions';

jest.mock('@proton/components/hooks/useApi');
const mockedUseApi = useApi as jest.MockedFunction<typeof useApi>;

jest.mock('@proton/account/userKeys/hooks');
const mockUseGetUserKeys = useGetUserKeys as jest.MockedFunction<any>;
mockUseGetUserKeys.mockReturnValue(jest.fn());

jest.mock('@proton/account/user/hooks');
const mockedUseUser = useUser as jest.MockedFunction<typeof useUser>;
mockedUseUser.mockReturnValue([{}] as any);

mockUseAddresses();

jest.mock('@proton/components/hooks/useNotifications');
const mockUseNotifications = useNotifications as jest.MockedFunction<any>;
mockUseNotifications.mockReturnValue({
    createNotification: jest.fn(),
});

jest.mock('@proton/mail/store/mailSettings/hooks');
const mockUseMailSettings = useGetMailSettings as jest.MockedFunction<any>;
mockUseMailSettings.mockReturnValue(jest.fn());

const IncomingAddressForwardingContext = applyHOCs(
    withCache(),
    withApi(),
    withEventManager(),
    withConfig(),
    withAuthentication()
)(IncomingForwardActions);

describe('IncomingForwardActions', () => {
    const setup = ({ State = ForwardingState.Pending } = {}) => {
        const mockApi = jest.fn().mockImplementation(() => Promise.resolve({}));
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

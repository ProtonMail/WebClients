import { fireEvent } from '@testing-library/react';

import { renderWithProviders } from '@proton/components/containers/contacts/tests/render';
import { useGetMailSettings } from '@proton/mail/mailSettings/hooks';
import { rejectForwarding } from '@proton/shared/lib/api/forwardings';
import type { Address, IncomingAddressForwarding } from '@proton/shared/lib/interfaces';
import { ForwardingState } from '@proton/shared/lib/interfaces';
import {
    applyHOCs,
    mockUseAddresses,
    withApi,
    withAuthentication,
    withCache,
    withConfig,
    withEventManager,
} from '@proton/testing';

import { useApi, useGetUserKeys, useNotifications, useUser } from '../../hooks';
import IncomingForwardActions from './IncomingForwardActions';

jest.mock('@proton/components/hooks/useApi');
const mockedUseApi = useApi as jest.MockedFunction<typeof useApi>;

jest.mock('@proton/components/hooks/useUserKeys');
const mockUseGetUserKeys = useGetUserKeys as jest.MockedFunction<any>;
mockUseGetUserKeys.mockReturnValue(jest.fn());

jest.mock('@proton/components/hooks/useUser');
const mockedUseUser = useUser as jest.MockedFunction<typeof useUser>;
mockedUseUser.mockReturnValue([{}] as any);

mockUseAddresses();

jest.mock('@proton/components/hooks/useNotifications');
const mockUseNotifications = useNotifications as jest.MockedFunction<any>;
mockUseNotifications.mockReturnValue({
    createNotification: jest.fn(),
});

jest.mock('@proton/mail/mailSettings/hooks');
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

    describe('when we click "Decline"', () => {
        it('should call the api', () => {
            const { getByText, mockApi, forward } = setup();
            fireEvent.click(getByText('Decline'));
            expect(mockApi).toHaveBeenCalledWith(rejectForwarding(forward.ID));
        });
    });
});

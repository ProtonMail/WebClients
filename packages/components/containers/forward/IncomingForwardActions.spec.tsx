import { fireEvent, render } from '@testing-library/react';

import { rejectForwarding } from '@proton/shared/lib/api/forwardings';
import { Address, ForwardingState, IncomingAddressForwarding } from '@proton/shared/lib/interfaces';
import { applyHOCs, withApi, withAuthentication, withCache, withConfig, withEventManager } from '@proton/testing';

import { useApi, useGetAddressKeys, useGetMailSettings, useGetUserKeys, useNotifications, useUser } from '../../hooks';
import IncomingForwardActions from './IncomingForwardActions';

jest.mock('@proton/components/hooks/useApi');
const mockedUseApi = useApi as jest.MockedFunction<typeof useApi>;

jest.mock('@proton/components/hooks/useUserKeys');
const mockUseGetUserKeys = useGetUserKeys as jest.MockedFunction<any>;
mockUseGetUserKeys.mockReturnValue(jest.fn());

jest.mock('@proton/components/hooks/useUser');
const mockedUseUser = useUser as jest.MockedFunction<typeof useUser>;
mockedUseUser.mockReturnValue([{}] as any);

jest.mock('@proton/components/hooks/useGetAddressKeys');
const mockUseGetAddressKeys = useGetAddressKeys as jest.MockedFunction<any>;
mockUseGetAddressKeys.mockReturnValue(jest.fn());

jest.mock('@proton/components/hooks/useNotifications');
const mockUseNotifications = useNotifications as jest.MockedFunction<any>;
mockUseNotifications.mockReturnValue({
    createNotification: jest.fn(),
});

jest.mock('@proton/components/hooks/useMailSettings');
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
        const mockApi = jest.fn();
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
        const utils = render(<IncomingAddressForwardingContext forward={forward} addresses={addresses} />);
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

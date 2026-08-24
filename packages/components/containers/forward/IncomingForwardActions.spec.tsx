import { fireEvent } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { useGetMailSettings } from '@proton/mail/store/mailSettings/hooks';
import type { Address, IncomingAddressForwarding } from '@proton/shared/lib/interfaces';
import { ForwardingState } from '@proton/shared/lib/interfaces';
import { applyHOCs } from '@proton/testing/lib/context/hocs/helpers';
import { withApi } from '@proton/testing/lib/context/hocs/with-api';
import { withAuthentication } from '@proton/testing/lib/context/hocs/with-authentication';
import { withCache } from '@proton/testing/lib/context/hocs/with-cache';
import { withConfig } from '@proton/testing/lib/context/hocs/with-config';
import { withEventManager } from '@proton/testing/lib/context/hocs/with-event-manager';
import { mockUseAddresses } from '@proton/testing/lib/mockUseAddresses';

import useApi from '../../hooks/useApi';
import useNotifications from '../../hooks/useNotifications';
import { renderWithProviders } from '../contacts/tests/render';
import IncomingForwardActions from './IncomingForwardActions';

jest.mock('../../hooks/useApi');
const mockedUseApi = useApi as jest.MockedFunction<typeof useApi>;

jest.mock('@proton/account/userKeys/hooks');
const mockUseGetUserKeys = useGetUserKeys as jest.MockedFunction<any>;
mockUseGetUserKeys.mockReturnValue(jest.fn());

jest.mock('@proton/account/user/hooks');
const mockedUseUser = useUser as jest.MockedFunction<typeof useUser>;
mockedUseUser.mockReturnValue([{}] as any);

mockUseAddresses();

jest.mock('../../hooks/useNotifications');
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

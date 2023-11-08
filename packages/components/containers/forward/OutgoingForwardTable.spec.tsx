import { render } from '@testing-library/react';

import { useAddresses, useAddressesKeys } from '@proton/components/hooks';
import { Address, ForwardingState, ForwardingType, UserModel } from '@proton/shared/lib/interfaces';
import {
    applyHOCs,
    mockUseUser,
    withApi,
    withAuthentication,
    withCache,
    withConfig,
    withEventManager,
    withNotifications,
} from '@proton/testing';

import OutgoingForwardTable from './OutgoingForwardTable';

const OutgoingForwardTableContext = applyHOCs(
    withApi(),
    withEventManager(),
    withCache(),
    withNotifications(),
    withConfig(),
    withAuthentication()
)(OutgoingForwardTable);

jest.mock('@proton/components/hooks/useAddresses');
const mockUseAddresses = useAddresses as jest.MockedFunction<any>;

jest.mock('@proton/components/hooks/useAddressesKeys');
const mockUserAddressesKeys = useAddressesKeys as jest.MockedFunction<any>;

describe('OutgoingForwardTable', () => {
    beforeEach(() => {
        const mockAddresses = [{ ID: 'AddressID' } as Address];
        const mockAddressesKeys = [{}];
        mockUseUser();
        mockUseAddresses.mockReturnValue([mockAddresses, false]);
        mockUserAddressesKeys.mockReturnValue(mockAddressesKeys);
    });

    const setup = () => {
        const addresses = [
            {
                ID: 'addressID',
                Email: 'forwarderEmail',
            },
        ] as Address[];
        const chainedEmails = [''];
        const user = {} as UserModel;
        const forwardings = [
            {
                ID: 'id',
                ForwarderAddressID: 'addressID',
                ForwardeeEmail: 'forwardeeEmail',
                State: ForwardingState.Active,
                CreateTime: 0,
                Type: ForwardingType.InternalEncrypted,
                Filter: null,
            },
        ];
        const utils = render(
            <OutgoingForwardTableContext
                user={user}
                forwardings={forwardings}
                addresses={addresses}
                chainedEmails={chainedEmails}
            />
        );
        return { ...utils };
    };
    describe('when we display outgoing address forwarding', () => {
        it('should show forwarder email address', () => {
            const { getByText } = setup();
            expect(getByText('forwarderEmail')).toBeInTheDocument();
        });

        it('should show forwardee email address', () => {
            const { getByText } = setup();
            expect(getByText('forwardeeEmail')).toBeInTheDocument();
        });
    });
});

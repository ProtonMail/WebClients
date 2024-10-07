import { useUser } from '@proton/account/user/hooks';
import { renderWithProviders } from '@proton/components/containers/contacts/tests/render';
import type { Address } from '@proton/shared/lib/interfaces';
import { ForwardingState, ForwardingType } from '@proton/shared/lib/interfaces';
import {
    applyHOCs,
    withApi,
    withAuthentication,
    withCache,
    withConfig,
    withEventManager,
    withNotifications,
} from '@proton/testing';

import IncomingForwardTable from './IncomingForwardTable';

jest.mock('@proton/account/user/hooks');
const mockedUseUser = useUser as jest.MockedFunction<typeof useUser>;
mockedUseUser.mockReturnValue([{}] as any);

const IncomingForwardTableContext = applyHOCs(
    withApi(),
    withEventManager(),
    withCache(),
    withNotifications(),
    withConfig(),
    withAuthentication()
)(IncomingForwardTable);

describe('IncomingForwardTable', () => {
    const setup = () => {
        const addresses = [
            {
                ID: 'addressID',
                Email: 'forwardeeEmail',
            },
        ] as Address[];
        const chainedEmails = [''];
        const forwardings = [
            {
                ID: 'id',
                ForwardeeAddressID: 'addressID',
                ForwarderEmail: 'forwarderEmail',
                CreateTime: 0,
                Type: ForwardingType.InternalEncrypted,
                State: ForwardingState.Active,
                Filter: null,
            },
        ];

        const utils = renderWithProviders(
            <IncomingForwardTableContext
                forwardings={forwardings}
                addresses={addresses}
                chainedEmails={chainedEmails}
            />
        );
        return { ...utils };
    };
    describe('when we display incoming address forwarding', () => {
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

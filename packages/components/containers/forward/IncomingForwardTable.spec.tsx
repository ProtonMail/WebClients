import { useUser } from '@proton/account/user/hooks';
import type { Address } from '@proton/shared/lib/interfaces';
import { ForwardingState, ForwardingType } from '@proton/shared/lib/interfaces';

import { applyHOCs } from '../../testing/hocs/helpers';
import { withApi } from '../../testing/hocs/with-api';
import { withAuthentication } from '../../testing/with-authentication';
import { withCache } from '../../testing/with-cache';
import { withConfig } from '../../testing/with-config';
import { withEventManager } from '../../testing/with-event-manager';
import { withNotifications } from '../../testing/with-notifications';
import { renderWithProviders } from '../contacts/tests/render';
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

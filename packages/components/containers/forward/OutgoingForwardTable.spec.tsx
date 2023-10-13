import { render } from '@testing-library/react';

import { Address, ForwardingState, ForwardingType, UserModel } from '@proton/shared/lib/interfaces';
import { applyHOCs, withApi, withCache, withEventManager, withNotifications } from '@proton/testing';

import OutgoingForwardTable from './OutgoingForwardTable';

const OutgoingForwardTableContext = applyHOCs(
    withApi(),
    withEventManager(),
    withCache(),
    withNotifications()
)(OutgoingForwardTable);

describe('OutgoingForwardTable', () => {
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

import { ForwardingType, OutgoingAddressForwarding } from '@proton/shared/lib/interfaces';

import { isLastOutgoingNonE2EEForwarding } from './helpers';

describe('isLastOutgoingNonE2EEForwarding', () => {
    describe('when forward is encrypted', () => {
        it('should return false', () => {
            const forward = { Type: ForwardingType.InternalEncrypted } as OutgoingAddressForwarding;
            const forwarding = [forward];
            const result = isLastOutgoingNonE2EEForwarding(forward, forwarding);
            expect(result).toBeFalsy();
        });
    });

    describe('when there is multiple external outgoing setup', () => {
        it('should return false', () => {
            const forward = {
                ForwarderAddressID: 'ForwarderAddressID',
                Type: ForwardingType.ExternalUnencrypted,
            } as OutgoingAddressForwarding;
            const forwarding = [forward, forward];
            const result = isLastOutgoingNonE2EEForwarding(forward, forwarding);
            expect(result).toBeFalsy();
        });
    });

    describe('when it is the latest external outgoing setup', () => {
        it('should return true', () => {
            const forward = {
                ForwarderAddressID: 'ForwarderAddressID',
                Type: ForwardingType.ExternalUnencrypted,
            } as OutgoingAddressForwarding;
            const internalForwarding = {
                ForwarderAddressID: 'ForwarderAddressID',
                Type: ForwardingType.ExternalEncrypted,
            } as OutgoingAddressForwarding;
            const forwarding = [forward, internalForwarding];
            const result = isLastOutgoingNonE2EEForwarding(forward, forwarding);
            expect(result).toBeTruthy();
        });
    });
});

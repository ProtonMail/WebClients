import type { OutgoingAddressForwarding } from '@proton/shared/lib/interfaces';
import { ForwardingType } from '@proton/shared/lib/interfaces';

import { getIsLastOutgoingNonE2EEForwarding } from './forwardHelper';

describe('getIsLastOutgoingNonE2EEForwarding', () => {
    describe('when the forwarding is e2ee', () => {
        it('should return false', () => {
            const forwardingConfig = { Type: ForwardingType.InternalEncrypted } as OutgoingAddressForwarding;
            const allOutgoingForwardingConfigs = [forwardingConfig];
            const result = getIsLastOutgoingNonE2EEForwarding(forwardingConfig, allOutgoingForwardingConfigs);
            expect(result).toBeFalsy();
        });
    });

    describe('when there are additional outgoing external forwardings', () => {
        it('should return false', () => {
            const forwardingConfig = {
                ForwarderAddressID: 'ForwarderAddressID',
                Type: ForwardingType.ExternalUnencrypted,
            } as OutgoingAddressForwarding;
            const allOutgoingForwardingConfigs = [forwardingConfig, forwardingConfig];
            const result = getIsLastOutgoingNonE2EEForwarding(forwardingConfig, allOutgoingForwardingConfigs);
            expect(result).toBeFalsy();
        });
    });

    describe('when it is the last outgoing external forwarding', () => {
        it('should return true', () => {
            const forwardingConfig = {
                ForwarderAddressID: 'ForwarderAddressID',
                Type: ForwardingType.ExternalUnencrypted,
            } as OutgoingAddressForwarding;
            const internalE2EEForwardingConfig = {
                ForwarderAddressID: 'ForwarderAddressID',
                Type: ForwardingType.InternalEncrypted,
            } as OutgoingAddressForwarding;
            const allOutgoingForwardingConfigs = [forwardingConfig, internalE2EEForwardingConfig];
            const result = getIsLastOutgoingNonE2EEForwarding(forwardingConfig, allOutgoingForwardingConfigs);
            expect(result).toBeTruthy();
        });
    });
});

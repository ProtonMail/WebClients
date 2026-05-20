import type { OutgoingAddressForwarding } from '@proton/shared/lib/interfaces';
import { ForwardingType } from '@proton/shared/lib/interfaces';

import { getIsLastOutgoingE2EEForwarding, getIsLastOutgoingNonE2EEForwarding } from './forwardHelper';

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

describe('getIsLastOutgoingE2EEForwarding', () => {
    describe('when the forwarding is unencrypted', () => {
        it('should return true', () => {
            const forwardingConfig = { Type: ForwardingType.ExternalUnencrypted } as OutgoingAddressForwarding;
            const allOutgoingForwardingConfigs = [forwardingConfig];
            const result = getIsLastOutgoingE2EEForwarding(forwardingConfig, allOutgoingForwardingConfigs);
            expect(result).toBeFalsy();
        });
    });

    describe('when there are additional outgoing e2ee forwardings', () => {
        it('should return false', () => {
            const forwardingConfig = {
                ForwarderAddressID: 'ForwarderAddressID',
                Type: ForwardingType.InternalEncrypted,
            } as OutgoingAddressForwarding;
            const anotherForwardingConfig = {
                ForwarderAddressID: 'ForwarderAddressID',
                Type: ForwardingType.ExternalEncrypted,
            } as OutgoingAddressForwarding;
            const allOutgoingForwardingConfigs = [forwardingConfig, anotherForwardingConfig];
            const result = getIsLastOutgoingE2EEForwarding(forwardingConfig, allOutgoingForwardingConfigs);
            expect(result).toBeFalsy();
        });
    });

    describe('when it is the last outgoing e2ee forwarding', () => {
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
            const result = getIsLastOutgoingE2EEForwarding(internalE2EEForwardingConfig, allOutgoingForwardingConfigs);
            expect(result).toBeTruthy();
        });
    });
});

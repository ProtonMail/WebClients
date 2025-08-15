import { canonicalizeEmailByGuess } from '@proton/shared/lib/helpers/email';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { Address, IncomingAddressForwarding, OutgoingAddressForwarding } from '@proton/shared/lib/interfaces';
import { ForwardingType } from '@proton/shared/lib/interfaces';

export const getChainedForwardingEmails = (
    incoming: IncomingAddressForwarding[],
    outgoing: OutgoingAddressForwarding[],
    addresses: Address[]
) => {
    const addressesMap = toMap(addresses);
    const forwardeeEmails = incoming.map(({ ForwardeeAddressID }) =>
        canonicalizeEmailByGuess(addressesMap[ForwardeeAddressID]?.Email || '')
    );
    const forwarderEmails = outgoing.map(({ ForwarderAddressID }) =>
        canonicalizeEmailByGuess(addressesMap[ForwarderAddressID]?.Email || '')
    );
    return forwarderEmails.filter((email) => forwardeeEmails.includes(email));
};

export const isChainedForwarding = (chainedEmails: string[], email: string) => {
    // chainedEmails is already canonicalized by getChainedForwardingEmails
    return chainedEmails.includes(canonicalizeEmailByGuess(email));
};

export const getIsLastOutgoingNonE2EEForwarding = (
    outgoingForwardingConfig: OutgoingAddressForwarding,
    allOutgoingForwardingConfigs: OutgoingAddressForwarding[]
): boolean => {
    if (outgoingForwardingConfig.Type !== ForwardingType.ExternalUnencrypted) {
        return false;
    }
    const nonE2EEForwardings = allOutgoingForwardingConfigs.filter(
        (f) =>
            f.Type === ForwardingType.ExternalUnencrypted &&
            f.ForwarderAddressID === outgoingForwardingConfig.ForwarderAddressID
    );
    return nonE2EEForwardings.length <= 1;
};

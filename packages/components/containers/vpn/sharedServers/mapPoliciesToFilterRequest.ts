import type { FilterPolicyRequest } from '@proton/components/containers/vpn/sharedServers/api';
import { PolicyState, PolicyType } from '@proton/components/containers/vpn/sharedServers/constants';
import type { VpnLocationFilterPolicy } from '@proton/components/containers/vpn/sharedServers/useSharedServers';

export const mapPoliciesToFilterRequest = (
    policies: VpnLocationFilterPolicy[],
    isEditing: boolean,
    policy?: VpnLocationFilterPolicy,
    updatedPolicy?: FilterPolicyRequest
): FilterPolicyRequest[] => {
    return policies.flatMap((p) => {
        // If editing and the policy matches, return the updated policy
        if (isEditing && policy && p.LocationFilterPolicyID === policy.LocationFilterPolicyID) {
            return updatedPolicy ? [updatedPolicy] : [];
        } else if (policy && p.LocationFilterPolicyID === policy.LocationFilterPolicyID) {
            return [];
        }

        return {
            ID: p.LocationFilterPolicyID,
            Name: p.Name,
            Type: p.Type,
            State: p.Type === PolicyType.Custom ? p.State : PolicyState.Inactive,
            Locations: p.Locations.map((loc) => ({ Country: loc.Country, City: loc.City })),
            UserIds: p.Users.length ? p.Users.map((user) => user.UserID) : null,
            GroupIds: p.Groups.length ? p.Groups.map((g) => g.GroupID) : null,
        };
    });
};

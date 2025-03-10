import type { FilterPolicyRequest } from '@proton/components/containers/vpn/sharedServers/api';
import { PolicyState, PolicyType } from '@proton/components/containers/vpn/sharedServers/constants';
import type { VpnLocationFilterPolicy } from '@proton/components/containers/vpn/sharedServers/useSharedServers';

export const mapPoliciesToFilterRequest = (policies: VpnLocationFilterPolicy[]): FilterPolicyRequest[] => {
    const isRemovingLastCustomPolicy = policies.filter((policy) => policy.Type === PolicyType.Custom).length === 0;
    const isOnPolicyActive =
        policies.filter((policy) => policy.Type === PolicyType.All && policy.State === PolicyState.Active).length === 1;

    return policies.flatMap((p) => {
        return {
            ID: p.LocationFilterPolicyID,
            Name: p.Name,
            Type: p.Type,
            State:
                p.Type === PolicyType.None && isRemovingLastCustomPolicy && !isOnPolicyActive
                    ? PolicyState.Active
                    : p.State,
            Locations: p.Locations.map((loc) => ({ Country: loc.Country, City: loc.City })),
            UserIds: p.Users.length ? p.Users.map((user) => user.UserID) : null,
            GroupIds: p.Groups.length ? p.Groups.map((g) => g.GroupID) : null,
        };
    });
};

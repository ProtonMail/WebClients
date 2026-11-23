import { PLANS } from '@proton/payments/core/constants';
import { DUO_MAX_USERS, FAMILY_MAX_USERS } from '@proton/shared/lib/constants';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';
import { getPlusServers } from '@proton/shared/lib/vpn/features';
import { VPN_SERVERS } from '@proton/shared/lib/vpn/vpnServers';

import { cachedPlans } from '../../../signup/defaultPlans';
import { getPlanInformation } from './getPlanInformation';

const getPlan = (name: PLANS) => cachedPlans.find((plan) => plan.Name === name) as Plan;

describe('getPlanInformation', () => {
    it.each([
        { name: PLANS.DUO, title: 'Proton Duo', users: `Up to ${DUO_MAX_USERS} users` },
        { name: PLANS.FAMILY, title: 'Proton Family', users: `Up to ${FAMILY_MAX_USERS} users` },
    ])('describes $title with its users, VPN servers and apps', ({ name, title, users }) => {
        const information = getPlanInformation({ loading: false, selectedPlan: getPlan(name) });

        expect(information?.title).toBe(title);
        expect(information?.features.map(({ id }) => id)).toEqual([
            'users',
            'countries',
            'mail-app',
            'calendar-app',
            'drive-app',
            'vpn-app',
            'pass-app',
        ]);
        expect(information?.features[0].text).toBe(users);
        expect(information?.features[1].text).toBe(
            getPlusServers(VPN_SERVERS.paid.servers, VPN_SERVERS.paid.countries)
        );
    });
});

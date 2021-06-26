import React from 'react';
import { toMap } from 'proton-shared/lib/helpers/object';
import { CYCLE, BLACK_FRIDAY } from 'proton-shared/lib/constants';
import { Currency, Cycle, Plan, PlanIDs, Subscription } from 'proton-shared/lib/interfaces';
import { isProductPayer } from 'proton-shared/lib/helpers/blackfriday';

import BlackFridayModal from './BlackFridayModal';

interface Props {
    plans: Plan[];
    subscription: Subscription;
    onSelect: (params: { planIDs: PlanIDs; cycle: Cycle; currency: Currency; couponCode?: string | null }) => void;
}

const VPNBlackFridayModal = ({ plans = [], subscription, ...rest }: Props) => {
    const plansMap = toMap(plans, 'Name');
    const bundles = isProductPayer(subscription)
        ? [
              {
                  name: 'ProtonVPN Plus + ProtonMail Plus',
                  cycle: CYCLE.TWO_YEARS,
                  planIDs: {
                      [plansMap.plus.ID]: 1,
                      [plansMap.vpnplus.ID]: 1,
                  },
              },
          ]
        : [
              {
                  name: 'Plus Plan',
                  cycle: CYCLE.YEARLY,
                  planIDs: { [plansMap.vpnplus.ID]: 1 },
                  couponCode: BLACK_FRIDAY.COUPON_CODE,
              },
              {
                  name: 'ProtonVPN Plus + ProtonMail Plus',
                  cycle: CYCLE.TWO_YEARS,
                  planIDs: {
                      [plansMap.plus.ID]: 1,
                      [plansMap.vpnplus.ID]: 1,
                  },
                  couponCode: BLACK_FRIDAY.COUPON_CODE,
                  popular: true,
              },
              {
                  name: 'ProtonVPN Plus + ProtonMail Plus',
                  cycle: CYCLE.YEARLY,
                  planIDs: {
                      [plansMap.plus.ID]: 1,
                      [plansMap.vpnplus.ID]: 1,
                  },
                  couponCode: BLACK_FRIDAY.COUPON_CODE,
              },
          ];

    return <BlackFridayModal className="blackfriday-mail-modal" bundles={bundles} {...rest} />;
};

export default VPNBlackFridayModal;

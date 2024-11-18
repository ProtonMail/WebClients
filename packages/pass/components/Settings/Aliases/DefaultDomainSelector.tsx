import { type FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Option, SelectTwo } from '@proton/components';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { PassPlusPromotionButton } from '@proton/pass/components/Upsell/PassPlusPromotionButton';
import { UpsellRef } from '@proton/pass/constants';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { getAliasDomains, setDefaultAliasDomain } from '@proton/pass/store/actions';
import { selectUserPlan } from '@proton/pass/store/selectors';
import type { MaybeNull, UserAliasDomainOutput } from '@proton/pass/types';

const getDomainLabel = (domain: UserAliasDomainOutput) => {
    if (domain.IsCustom) {
        return `(${c('Label').t`Your domain`})`;
    } else if (domain.IsPremium) {
        return `(${c('Label').t`Premium domain`})`;
    } else {
        return `(${c('Label').t`Public domain`})`;
    }
};

type Props = {
    className?: string;
};

export const DefaultDomainSelector: FC<Props> = ({ className }) => {
    const [domains, setDomains] = useState<MaybeNull<UserAliasDomainOutput[]>>(null);
    const [defaultDomain, setDefaultDomain] = useState<MaybeNull<string>>(null);
    const spotlight = useSpotlight();
    const canManageAlias = useSelector(selectUserPlan)?.ManageAlias;

    const getAllDomains = useRequest(getAliasDomains, {
        onSuccess: (data) => {
            setDomains(data);
            const defaultDomain = data.find(({ IsDefault }) => IsDefault)?.Domain;
            if (defaultDomain) setDefaultDomain(defaultDomain);
        },
    });

    const setDomain = useRequest(setDefaultAliasDomain, {
        onSuccess: ({ DefaultAliasDomain }) => setDefaultDomain(DefaultAliasDomain ?? null),
    });

    const handleChange = (value: MaybeNull<string>) => {
        if (value === null) return;

        const isPremiumDomain = domains?.find((domain) => domain.Domain === value)?.IsPremium;
        if (isPremiumDomain && !canManageAlias) {
            return spotlight.setUpselling({
                type: 'pass-plus',
                upsellRef: UpsellRef.SETTING,
            });
        }

        setDomain.dispatch(value);
    };

    useEffect(getAllDomains.dispatch, []);

    return (
        <SelectTwo<MaybeNull<string>>
            placeholder={c('Label').t`Select a domain`}
            onValue={handleChange}
            value={defaultDomain}
            loading={getAllDomains.loading || setDomain.loading}
            className={className}
        >
            {domains
                ? domains.map((domain) => (
                      <Option
                          value={domain.Domain}
                          title={domain.Domain}
                          key={domain.Domain}
                          className="flex justify-space-between items-center flex-nowrap"
                      >
                          <span>
                              {domain.Domain} {getDomainLabel(domain)}
                          </span>
                          {!canManageAlias && domain.IsPremium && domain.Domain !== defaultDomain && (
                              <span className="">
                                  <PassPlusPromotionButton />
                              </span>
                          )}
                      </Option>
                  ))
                : []}
        </SelectTwo>
    );
};

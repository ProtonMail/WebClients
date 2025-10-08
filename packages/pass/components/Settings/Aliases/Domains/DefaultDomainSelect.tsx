import type { FC } from 'react';

import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { PassPlusPromotionButton } from '@proton/pass/components/Upsell/PassPlusPromotionButton';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { UpsellRef } from '@proton/pass/constants';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { setDefaultAliasDomain } from '@proton/pass/store/actions';
import type { MaybeNull, UserAliasDomainOutput } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';

import { useAliasDomains } from './DomainsProvider';

const getDomainLabel = (domain: UserAliasDomainOutput) => {
    if (domain.IsCustom) return `(${c('Label').t`Your domain`})`;
    else if (domain.IsPremium) return `(${c('Label').t`Premium domain`})`;
    else return `(${c('Label').t`Public domain`})`;
};

type Props = { className?: string };

export const DefaultDomainSelect: FC<Props> = ({ className }) => {
    const { aliasDomains, defaultAliasDomain, canManage, loading, onSetDefault } = useAliasDomains();
    const setDefault = useRequest(setDefaultAliasDomain, { onSuccess: onSetDefault });
    const upsell = useUpselling();

    const handleChange = (value: MaybeNull<string>) => {
        const isPremiumDomain = aliasDomains?.find((domain) => domain.Domain === value)?.IsPremium;
        if (isPremiumDomain && !canManage) {
            return upsell({
                type: 'pass-plus',
                upsellRef: UpsellRef.SETTING,
            });
        }

        setDefault.dispatch(value);
    };

    // translator: Label for selecting a default domain, singular only
    const notSelectedLabel = c('Label').t`Not selected`;

    return (
        <SelectTwo<MaybeNull<string>>
            placeholder={c('Label').t`Select a domain`}
            onValue={handleChange}
            value={defaultAliasDomain}
            loading={loading || setDefault.loading}
            disabled={loading}
            className={className}
        >
            {[
                ...aliasDomains.map((domain) => (
                    <Option
                        value={domain.Domain}
                        title={domain.Domain}
                        key={domain.Domain}
                        className="flex justify-space-between items-center flex-nowrap"
                    >
                        <span>
                            {domain.Domain} {getDomainLabel(domain)}
                        </span>
                        {!canManage && domain.IsPremium && domain.Domain !== defaultAliasDomain && (
                            <span className="">
                                <PassPlusPromotionButton />
                            </span>
                        )}
                    </Option>
                )),
                !loading && (
                    <Option value={null} title={notSelectedLabel} key="not-selected">
                        {notSelectedLabel}
                    </Option>
                ),
            ].filter(truthy)}
        </SelectTwo>
    );
};

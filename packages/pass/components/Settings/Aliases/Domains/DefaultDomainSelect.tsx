import type { FC } from 'react';

import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { PassPlusPromotionButton } from '@proton/pass/components/Upsell/PassPlusPromotionButton';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { UpsellRef } from '@proton/pass/constants';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { getDomainLabel } from '@proton/pass/lib/alias/alias.utils';
import { setDefaultAliasDomain } from '@proton/pass/store/actions';
import type { MaybeNull } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';

import { useAliasDomains } from './DomainsProvider';

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
                ...aliasDomains.map(({ Domain, IsCustom, IsPremium }) => (
                    <Option
                        value={Domain}
                        title={Domain}
                        key={Domain}
                        className="flex justify-space-between items-center flex-nowrap"
                    >
                        <span>{getDomainLabel({ name: Domain, isCustom: IsCustom, isPremium: IsPremium })}</span>
                        {!canManage && IsPremium && Domain !== defaultAliasDomain && (
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

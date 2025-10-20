import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import Price from '@proton/components/components/price/Price';

import type { UnlimitedToDuoConfig } from '../helpers/interface';
import { UnlimitedToDuoOfferFooter } from './UnlimitedToDuoOfferFooter';
import { UnlimitedToDuoOfferHeader } from './UnlimitedToDuoOfferHeader';

interface Props {
    config: UnlimitedToDuoConfig;
    onUpsellClick: () => void;
    onNeverShow: () => void;
}

// TODO: create rotation logic for both modals. Hardcoded for first modal right now.
const getFeatures = () => [
    { name: c('Duo offer').t`1 TB of storage to share` },
    { name: c('Duo offer').t`2 user accounts` },
    { name: c('Duo offer').t`All premium features from your current plan` },
];

export const UnlimitedToDuoOfferContent = ({ config, onUpsellClick, onNeverShow }: Props) => {
    const features = getFeatures();

    return (
        <section className="pt-6">
            <UnlimitedToDuoOfferHeader />

            <div className="flex">
                <p className="mt-2 mb-5 mx-auto inline-flex" style={{ color: 'var(--promotion-text-weak)' }}>
                    <Price
                        key="monthly-price"
                        currency={config.currency}
                        prefix={c('Duo offer').t`Only`}
                        suffix={c('Duo offer').t`/month`}
                        isDisplayedInSentence
                    >
                        {config.price}
                    </Price>
                </p>
            </div>

            <ul className="unstyled my-0 mb-3">
                {features.map((feature) => (
                    <li key={feature.name} className="flex flex-nowrap items-start gap-2 mb-1">
                        <Icon className="shrink-0 color-primary mt-0.5" name="checkmark" />
                        <span className="flex-1">{feature.name}</span>
                    </li>
                ))}
            </ul>

            <UnlimitedToDuoOfferFooter onClick={onUpsellClick} onNeverShow={onNeverShow} />
        </section>
    );
};

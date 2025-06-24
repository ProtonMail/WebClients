import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';

import type { UnlimitedOfferConfig } from '../helpers/interface';
import { FeatureList } from './FeatureList';
import { GoUnlimitedOfferHeader } from './GoUnlimitedOfferHeader';
import { GoUnlimitedOfferFooter } from './GoUnlimiterOfferFooter';

import './GoUnlimited.scss';

interface Props {
    config: UnlimitedOfferConfig;
    onNeverShow: () => void;
    onUpsellClick: () => void;
}

export const GoUnlimitedOfferContent = ({ config, onUpsellClick, onNeverShow }: Props) => {
    return (
        <section className="pt-6">
            <GoUnlimitedOfferHeader config={config} />

            <div className="flex">
                <p className="mt-2 mb-5 mx-auto inline-flex" style={{ color: 'var(--promotion-text-weak)' }}>
                    <Price
                        key="monthly-price"
                        currency={config.currency}
                        prefix={c('Unlimited offer').t`Only`}
                        suffix={c('Unlimited offer').t`/month`}
                        isDisplayedInSentence
                    >
                        {config.price}
                    </Price>
                </p>
            </div>

            <FeatureList className="mb-3" config={config} />
            <GoUnlimitedOfferFooter onClick={onUpsellClick} onNeverShow={onNeverShow} />
        </section>
    );
};

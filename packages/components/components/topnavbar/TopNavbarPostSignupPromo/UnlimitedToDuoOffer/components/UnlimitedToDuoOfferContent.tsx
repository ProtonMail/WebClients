import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';

import { FeatureList } from '../../common/components/FeatureList';
import type { UnlimitedToDuoOfferConfig } from '../helpers/interface';
import { UnlimitedToDuoOfferFooter } from './UnlimitedToDuoOfferFooter';
import { UnlimitedToDuoOfferHeader } from './UnlimitedToDuoOfferHeader';

interface Props {
    config: UnlimitedToDuoOfferConfig;
    onUpsellClick: () => void;
    onNeverShow: () => void;
}

export const UnlimitedToDuoOfferContent = ({ config, onUpsellClick, onNeverShow }: Props) => {
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

            <FeatureList className="mb-3" config={config} />

            <UnlimitedToDuoOfferFooter onClick={onUpsellClick} onNeverShow={onNeverShow} />
        </section>
    );
};

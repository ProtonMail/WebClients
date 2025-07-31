import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { getPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';

import { PostSignupOneDollarTable } from '../PostSignupOneDollar/components/PostSignupOneDollarTable';
import type { FeatureProps } from '../PostSignupOneDollar/interface';

interface Props {
    planName: string;
    features: FeatureProps[];
    title?: ReactNode;
    upgradeButton?: ReactNode;
    onClose: () => void;
    onUpsellClick: () => void;
}

export const AlwaysOnUpsellContent = ({ planName, features, title, upgradeButton, onClose, onUpsellClick }: Props) => (
    <section className="p-6 pt-12">
        <header className="text-center mb-4">
            <h2 className="text-xl text-bold text-wrap-balance">{title ?? c('Title').t`Upgrade to ${planName}`}</h2>
        </header>

        <PostSignupOneDollarTable features={features} />

        <div className="text-center">
            <Button color="norm" className="mb-4" onClick={onUpsellClick} fullWidth>
                {upgradeButton ?? getPlanOrAppNameText(planName)}
            </Button>
            <Button onClick={onClose} shape="underline" color="norm" className="p-0">
                {c('Button').t`Maybe later`}
            </Button>
        </div>
    </section>
);

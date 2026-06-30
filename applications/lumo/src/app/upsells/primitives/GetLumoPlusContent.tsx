import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import LumoPlusLogoInline from '../../components/Icons/LumoPlusLogoInline';

import './GetLumoPlusContent.scss';

interface GetLumoPlusContentProps {
    customText?: string;
    customTextClass?: string;
    withGradient?: boolean;
}

// Used by BlackFridayOfferNavbarButton — remove when Black Friday offer is archived
export const GetLumoPlusContent = ({
    customText,
    customTextClass = '',
    withGradient = true,
}: GetLumoPlusContentProps) => (
    <span className="flex items-center gap-2">
        <span className={clsx('text-bold syne-font', customTextClass)}>
            {customText || c('collider_2025: Upsell Title').t`Get`}
        </span>
        <LumoPlusLogoInline height="12px" withGradient={withGradient} />
    </span>
);

export const UpgradeToLumoPlusContent = () => (
    <span className="flex items-center gap-2 justify-center">
        <span>{c('collider_2025: Upsell Title').t`Upgrade`}</span>
    </span>
);

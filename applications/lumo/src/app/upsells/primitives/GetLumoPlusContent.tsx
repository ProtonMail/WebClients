import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
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
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M8.75011 2.5L6.66678 7.5L10.0001 18.3333M10.0001 18.3333L13.3334 7.5L11.2501 2.5M10.0001 18.3333C10.2644 18.3333 10.5246 18.2705 10.7598 18.1499C10.995 18.0293 11.1982 17.8546 11.3526 17.64L18.0109 8.485C18.2222 8.19671 18.3352 7.84813 18.3333 7.49071C18.3313 7.13329 18.2145 6.78597 18.0001 6.5L15.5001 3.16667C15.3449 2.95967 15.1436 2.79167 14.9121 2.67595C14.6807 2.56024 14.4255 2.5 14.1668 2.5H5.83345C5.57421 2.50003 5.31856 2.56053 5.08681 2.6767C4.85506 2.79286 4.6536 2.96149 4.49845 3.16917L2.00011 6.5C1.78558 6.78588 1.66863 7.13316 1.66653 7.49057C1.66443 7.84799 1.77729 8.19662 1.98845 8.485L8.64678 17.64C8.80115 17.8546 9.00434 18.0293 9.23958 18.1499C9.47482 18.2705 9.73578 18.3333 10.0001 18.3333ZM1.66678 7.5H18.3334"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>

        <span>{c('collider_2025: Upsell Title').t`Upgrade to ${LUMO_SHORT_APP_NAME} Plus`}</span>
    </span>
);

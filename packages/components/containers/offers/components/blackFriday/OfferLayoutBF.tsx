import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { getLanguageCode } from '@proton/shared/lib/i18n/helper';
import blackFridayImg2PlansPl from '@proton/styles/assets/img/promotions/bf2025-2plans-pl.svg';
import blackFridayImg2PlansTr from '@proton/styles/assets/img/promotions/bf2025-2plans-tr.svg';
import blackFridayImg2Plans from '@proton/styles/assets/img/promotions/bf2025-2plans.svg';
import blackFridayImgLumoPl from '@proton/styles/assets/img/promotions/bf2025-lumo-pl.svg';
import blackFridayImgLumoTr from '@proton/styles/assets/img/promotions/bf2025-lumo-tr.svg';
import blackFridayImgLumo from '@proton/styles/assets/img/promotions/bf2025-lumo.svg';
import blackFridayImgPl from '@proton/styles/assets/img/promotions/bf2025-pl.svg';
import blackFridayImgTr from '@proton/styles/assets/img/promotions/bf2025-tr.svg';
import blackFridayImgAll from '@proton/styles/assets/img/promotions/bf2025.svg';
import clsx from '@proton/utils/clsx';

import type { OfferProps } from '../../interface';

import './OfferLayoutBF.scss';

interface Props extends OfferProps {
    children: ReactNode;
}

const OfferLayoutBF = ({ children, offer }: Props) => {
    const [userSettings] = useUserSettings();
    const userLocale = getLanguageCode(userSettings?.Locale); // "en_US" → "en"

    const hasMultipleDeals = offer?.deals?.length > 1;
    const has3Deals = offer?.deals?.length > 2;
    const hideDealTitle = offer?.hideDealTitle;
    const subTitle = offer?.subTitle;

    // in some languages, we need to translate the images
    const getImages = (userLocale: string) => {
        if (userLocale === 'pl') {
            return {
                lumoImg: blackFridayImgLumoPl,
                twoPlansImg: blackFridayImg2PlansPl,
                blackFridayImg: blackFridayImgPl,
            };
        } else if (userLocale === 'tr') {
            return {
                lumoImg: blackFridayImgLumoTr,
                twoPlansImg: blackFridayImg2PlansTr,
                blackFridayImg: blackFridayImgTr,
            };
        } else {
            return {
                lumoImg: blackFridayImgLumo,
                twoPlansImg: blackFridayImg2Plans,
                blackFridayImg: blackFridayImgAll,
            };
        }
    };

    const { lumoImg, twoPlansImg, blackFridayImg } = getImages(userLocale);

    const imgHeader =
        offer?.ID === 'black-friday-2025-lumo-free-yearly' ||
        offer?.ID === 'black-friday-2025-lumo-plus-monthly'
            ? lumoImg
            : blackFridayImg;

    // translator: translate "Black Friday" only if it's problematic in your language (offensive/unknown/etc.)
    const imgAlt = c('BF2025: Heading alt').t`Black Friday`;

    return (
        <>
            <div className="flex text-center mt-6 md:mt-10 flex-nowrap">
                <h1
                    className={clsx([
                        'inline-flex flex-nowrap gap-2 flex-column',
                        hasMultipleDeals && 'md:mx-auto md:flex-row max-w-5/6 md:max-w-full',
                    ])}
                >
                    <div className="flex mx-2 mt-3">
                        {hasMultipleDeals ? (
                            <img src={twoPlansImg} alt={imgAlt} className="mx-auto" />
                        ) : (
                            <img src={imgHeader} alt={imgAlt} className="mr-auto" />
                        )}
                    </div>
                </h1>
            </div>
            {subTitle && hasMultipleDeals && (
                <div
                    className="text-center my-4 text-bold text-2xl text-wrap-balance max-w-custom mx-auto"
                    style={{ '--max-w-custom': '40em' }}
                >
                    {subTitle()}
                </div>
            )}

            <div
                className={clsx(
                    'offer-main-wrapper',
                    hideDealTitle && 'offer-main-wrapper--no-deal-title',
                    has3Deals && 'offer-main-wrapper--3deals'
                )}
            >
                <div
                    className={clsx('offer-main-content-container', !hasMultipleDeals && 'flex-1 px-0 sm:px-0 md:px-6')}
                >
                    <div className="offer-main-content">{children}</div>
                </div>
            </div>
        </>
    );
};

export default OfferLayoutBF;

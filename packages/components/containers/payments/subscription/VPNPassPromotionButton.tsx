import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Logo from '@proton/components/components/logo/Logo';
import { PromotionBanner } from '@proton/components/containers/banner/PromotionBanner';
import { CYCLE, PASS_APP_NAME } from '@proton/shared/lib/constants';
import type { Currency } from '@proton/shared/lib/interfaces';

import { getSimplePriceString } from '../../../components/price/helper';
import getBoldFormattedText from '../../../helpers/getBoldFormattedText';

interface VPNPassPromotionButtonProps {
    onClick: () => void;
    currency: Currency;
    cycle: CYCLE;
}

const VPNPassPromotionButton = ({ onClick, currency, cycle }: VPNPassPromotionButtonProps) => {
    const price = getSimplePriceString(currency, 100, c('Suffix').t`/month`);
    const priceNoSuffix = getSimplePriceString(currency, 100);
    return (
        <PromotionBanner
            mode="banner"
            className="pr-4"
            rounded
            contentCentered={false}
            description={
                <>
                    {cycle === CYCLE.MONTHLY
                        ? getBoldFormattedText(
                              c('bf2023: Action')
                                  .t`Subscribe for 15 months and get our **encrypted password manager** for only ${priceNoSuffix} extra per month!`
                          )
                        : getBoldFormattedText(
                              c('bf2023: Action').t`**Add our encrypted password manager** for only ${price}`
                          )}
                    <div className="mt-4">
                        <Button
                            onClick={onClick}
                            className="flex flex-nowrap items-center justify-center"
                            fullWidth
                            shape="outline"
                            color="norm"
                        >
                            <Logo appName="proton-pass" variant="glyph-only" className="shrink-0" size={4} />
                            <span className="ml-2">
                                {cycle === CYCLE.MONTHLY
                                    ? c('bf2023: Action').t`Get the deal`
                                    : c('bf2023: Action').t`Add ${PASS_APP_NAME}`}
                            </span>
                        </Button>
                    </div>
                </>
            }
        />
    );
};

export default VPNPassPromotionButton;

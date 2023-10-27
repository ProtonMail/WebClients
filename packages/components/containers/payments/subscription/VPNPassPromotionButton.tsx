import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CYCLE, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { Currency } from '@proton/shared/lib/interfaces';

import Logo from '../../../components/logo/Logo';
import { getSimplePriceString } from '../../../components/price/helper';
import getBoldFormattedText from '../../../helpers/getBoldFormattedText';
import PromotionBanner from '../../banner/PromotionBanner';

interface VPNPassPromotionButtonProps {
    onClick: () => void;
    currency: Currency;
    cycle: CYCLE;
}

const VPNPassPromotionButton = ({ onClick, currency, cycle }: VPNPassPromotionButtonProps) => {
    const price = getSimplePriceString(currency, 100, c('Suffix').t`/month`);
    const priceNoSuffix = getSimplePriceString(currency, 100, '');
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
                            className="flex flex-nowrap flex-align-items-center flex-justify-center"
                            fullWidth
                            shape="outline"
                            color="norm"
                        >
                            <Logo appName="proton-pass" variant="glyph-only" className="flex-item-noshrink" size={16} />
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

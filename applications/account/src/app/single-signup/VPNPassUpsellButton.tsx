import { c } from 'ttag';

import { PassLogo, Toggle } from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import type { ToggleProps } from '@proton/components/components/toggle/Toggle';
import type { CYCLE } from '@proton/shared/lib/constants';
import { PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import type { Currency } from '@proton/shared/lib/interfaces';

import SaveLabel2 from './SaveLabel2';

interface VPNPassUpsellToggleProps extends Omit<ToggleProps, 'ref'> {
    currency: Currency;
    cycle: CYCLE;
    view?: 'included';
}

const VPNPassUpsellToggle = ({ currency, cycle, view, ...rest }: VPNPassUpsellToggleProps) => {
    if (view === 'included') {
        const plan = `${PASS_APP_NAME} Plus`;
        return (
            <div className="p-2 flex flex-nowrap gap-1 items-start">
                <div className="shrink-0">
                    <PassLogo size={8} variant="glyph-only" />
                </div>
                <div className="flex-1 text-sm color-weak">{c('vpn_2step: info')
                    .t`Includes ${plan}, our premium password manager, free for the first year!`}</div>
            </div>
        );
    }

    const price = getSimplePriceString(currency, 399, c('Suffix').t`/month`);
    const plan = `${PASS_SHORT_APP_NAME} Plus`;
    return (
        <div className="p-2 flex flex-nowrap gap-1 items-start">
            <Toggle id="toggle-upsell-pass" className="mx-1 shrink-0" {...rest} />
            <label htmlFor="toggle-upsell-pass" className="flex-1 text-sm">
                <span className="text-semibold">{c('bf2023: Action').t`Save even more with a 12-month plan`}</span>
                <ul className="m-0 p-0 mt-1 pl-5">
                    {[
                        {
                            key: 1,
                            text: (
                                <>
                                    {c('vpn_2step: info').t`Just ${price}`}{' '}
                                    <SaveLabel2 className="text-sm inline-block" highlightPrice>
                                        {`− 60%`}
                                    </SaveLabel2>
                                </>
                            ),
                        },
                        {
                            key: 2,
                            text: c('vpn_2step: info').t`Includes ${plan} (free for the first year!)`,
                        },
                    ].map(({ key, text }) => {
                        return <li key={key}>{text}</li>;
                    })}
                </ul>
            </label>
        </div>
    );
};

export default VPNPassUpsellToggle;

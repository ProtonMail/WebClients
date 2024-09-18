import type { ReactElement } from 'react';

import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { Plan } from '@proton/shared/lib/interfaces';

export const AdditionalOptionsCustomiser = ({
    addon,
    price,
    input,
    showDescription = true,
}: {
    addon: Plan;
    price: ReactElement;
    input: ReactElement;
    showDescription?: boolean;
}) => {
    return (
        <>
            {showDescription && (
                <>
                    <h2 className="text-2xl text-bold mb-4">{c('Info').t`Additional options`}</h2>
                    <div className="mb-4">
                        {c('Info')
                            .jt`Email hosting for 10 custom email domain names is included for free. Additional domains can be added for ${price}.`}
                    </div>
                </>
            )}
            <div className="flex *:min-size-auto md:flex-nowrap items-center mb-4">
                <label
                    htmlFor={addon.Name}
                    className="w-full md:w-auto min-w-custom md:min-w-custom flex-1 plan-customiser-addon-label text-bold pr-2"
                    style={{ '--min-w-custom': '8em', '--md-min-w-custom': '14em' }}
                >
                    {c('Info').t`Custom email domains`}
                    <Info
                        className="ml-2"
                        title={c('Info')
                            .t`Email hosting is only available for domains you already own. Domain registration is not currently available through ${BRAND_NAME}. You can host email for domains registered on any domain registrar.`}
                    />
                </label>
                {input}
            </div>
        </>
    );
};

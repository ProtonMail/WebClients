import type { ReactElement } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import { Icon } from '@proton/components/components';
import { getScribeUpsellLearnMore, getScribeUpsellText } from '@proton/components/containers';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { Plan } from '@proton/shared/lib/interfaces';
import { Audience } from '@proton/shared/lib/interfaces';

import { AccountSizeCustomiser } from './planCustomizer/AccountSizeCustomiser';

const ScribeB2BBanner = ({ onClick, price }: { onClick: () => void; price: ReactElement }) => (
    <div
        className="border p-4 flex flex-column lg:flex-row gap-2 flex-nowrap items-start lg:items-center rounded-lg"
        style={{ background: 'linear-gradient(85deg, rgb(112 76 255 / 0.15) 0%, rgb(70 26 255 / 0.04) 100%)' }}
    >
        <div className="w-full">
            <p className="m-0 mb-1 text-lg">
                {/* {translator: Full sentence: Add writing assistant for ${price} per user per month } */}
                <strong className="block lg:inline">{c('mail_signup_2024: Info')
                    .t`Add ${BRAND_NAME} Scribe writing assistant`}</strong>{' '}
                {c('mail_signup_2024: Info').jt`for ${price}`}
            </p>
            <p className="m-0 text-sm color-weak">
                {getScribeUpsellText()}{' '}
                <Href href={getScribeUpsellLearnMore()} className="inline-block color-weak text-normal">
                    {c('Link').t`Learn more`}
                </Href>
            </p>
        </div>
        <Button color="norm" shape="outline" className="shrink-0 flex items-center gap-1" pill onClick={onClick}>
            <Icon name="plus" className="shrink-0" />
            <span>{c('Action').t`Add`}</span>
        </Button>
    </div>
);

interface Props {
    addon: Plan;
    maxUsers: number;
    price: ReactElement;
    input: ReactElement;
    showDescription?: boolean;
    showTooltip?: boolean;
    audience?: Audience;
    showScribeBanner?: boolean;
    onShowScribeBanner: () => void;
    value: number;
}

const ScribeAddon = ({
    addon,
    input,
    value,
    price,
    maxUsers,
    showDescription,
    showTooltip,
    audience,
    showScribeBanner,
    onShowScribeBanner,
}: Props) => {
    if (audience === Audience.B2B && showScribeBanner) {
        return <ScribeB2BBanner price={price} onClick={onShowScribeBanner} />;
    }

    return (
        <AccountSizeCustomiser
            key={`${addon.Name}-size`}
            addon={addon}
            price={price}
            input={input}
            value={value}
            maxUsers={maxUsers}
            showDescription={showDescription}
            showTooltip={showTooltip}
            mode="gpt-seats"
        />
    );
};

export default ScribeAddon;

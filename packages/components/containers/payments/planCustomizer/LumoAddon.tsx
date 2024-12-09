import { type ReactElement, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { LUMO_APP_NAME } from '@proton/shared/lib/constants';
import type { Plan } from '@proton/shared/lib/interfaces';

import { AccountSizeCustomiser } from './AccountSizeCustomiser';

const LumoAddonBanner = ({ onClick, price }: { onClick: () => void; price: ReactElement }) => (
    <div
        className="border p-4 flex flex-column lg:flex-row gap-2 flex-nowrap items-start lg:items-center rounded-lg"
        style={{ background: 'linear-gradient(85deg, rgb(112 76 255 / 0.15) 0%, rgb(70 26 255 / 0.04) 100%)' }}
    >
        <div className="w-full">
            <p className="m-0 mb-1 text-lg">
                {/* {translator: Full sentence: Add writing assistant for ${price} per user per month } */}
                <strong className="block lg:inline">{c('collider_2025: Info').t`Add ${LUMO_APP_NAME}`}</strong>{' '}
                {c('mail_signup_2024: Info').jt`for ${price}`}
            </p>
            <p className="m-0 text-sm color-weak">
                {c('collider_2025: Info')
                    .t`${LUMO_APP_NAME} is a privacy-first AI that helps you get more done while keeping your data secure. Unlock its full potential and enjoy early access to new features as they’re introduced.`}
            </p>
        </div>
        <Button color="norm" shape="outline" className="shrink-0 flex items-center gap-1" pill onClick={onClick}>
            <Icon name="plus" className="shrink-0" />
            <span>{c('Action').t`Add`}</span>
        </Button>
    </div>
);

interface Props {
    price: ReactElement;
    onAddLumo: () => void;
    addon: Plan;
    maxUsers: number;
    input: ReactElement;
    showDescription?: boolean;
    showTooltip?: boolean;
    value: number;
}

const LumoAddon = ({ price, onAddLumo, addon, input, value, maxUsers, showDescription, showTooltip }: Props) => {
    const [showLumoBanner, setShowLumoBanner] = useState(value === 0);

    if (showLumoBanner) {
        return (
            <div>
                <LumoAddonBanner
                    price={price}
                    onClick={() => {
                        setShowLumoBanner(false);
                        onAddLumo();
                    }}
                />
            </div>
        );
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
            mode="lumo"
        />
    );
};

export default LumoAddon;

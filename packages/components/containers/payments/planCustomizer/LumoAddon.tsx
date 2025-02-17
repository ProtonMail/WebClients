import { type ReactElement, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { LUMO_APP_NAME } from '@proton/shared/lib/constants';
import type { Plan } from '@proton/shared/lib/interfaces';

import { NumberCustomiser, type NumberCustomiserProps } from './NumberCustomiser';

const LumoAddonBanner = ({ onClick }: { onClick: () => void; price: ReactElement }) => (
    <div
        className="border p-4 flex flex-column lg:flex-row gap-2 flex-nowrap items-start lg:items-center rounded-lg"
        style={{ background: 'linear-gradient(85deg, rgb(112 76 255 / 0.15) 0%, rgb(70 26 255 / 0.04) 100%)' }}
        data-testid="lumo-addon-banner"
    >
        <div className="w-full">
            <p className="m-0 mb-1 text-lg"></p>
            <p className="m-0 text-sm color-weak"></p>
        </div>
        <Button color="norm" shape="outline" className="shrink-0 flex items-center gap-1" pill onClick={onClick}>
            <Icon name="plus" className="shrink-0" />
            <span>{c('Action').t`Add`}</span>
        </Button>
    </div>
);

interface LumoAddonProps extends Omit<NumberCustomiserProps, 'label' | 'tooltip'> {
    price: ReactElement;
    addon: Plan;
    onAddLumo: () => void;
}

const LumoAddon = ({ price, onAddLumo, value, ...rest }: LumoAddonProps) => {
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
    return <NumberCustomiser label={LUMO_APP_NAME} value={value} {...rest} />;
};

export default LumoAddon;

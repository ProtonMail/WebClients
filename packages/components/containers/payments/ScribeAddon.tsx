import type { ReactElement } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import Icon from '@proton/components/components/icon/Icon';
import {
    getScribeUpsellLearnMore,
    getScribeUpsellText,
} from '@proton/components/containers/payments/subscription/assistant/helpers';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';

import { NumberCustomiser, type NumberCustomiserProps } from './planCustomizer/NumberCustomiser';

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

interface ScribeAddonProps extends Omit<NumberCustomiserProps, 'label' | 'tooltip'> {
    price: ReactElement;
    audience?: Audience;
    showScribeBanner?: boolean;
    onAddScribe: () => void;
    showTooltip?: boolean;
}

const ScribeAddon = ({ price, audience, showScribeBanner, onAddScribe, showTooltip, ...rest }: ScribeAddonProps) => {
    if (audience === Audience.B2B && showScribeBanner) {
        return (
            <div>
                <ScribeB2BBanner price={price} onClick={onAddScribe} />
            </div>
        );
    }

    return (
        <NumberCustomiser
            label={c('Info').t`${BRAND_NAME} Scribe writing assistant`}
            tooltip={
                showTooltip
                    ? c('Info').t`AI powered assistant to help you craft better emails, quickly and effortlessly.`
                    : undefined
            }
            {...rest}
        />
    );
};

export default ScribeAddon;

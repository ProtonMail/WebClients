import * as React from 'react';
import { c } from 'ttag';

import { Button, Icon, Info } from '../../../components';

interface SubscriptionOptionProps {
    name: string;
    title: string;
    price: React.ReactNode;
    description: string;
    features: { content: string; info?: string }[];
    onSelect: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const SubscriptionOption = ({ name, title, price, description, features = [], onSelect }: SubscriptionOptionProps) => (
    <div className="flex-autogrid-item" data-plan-name={name}>
        <div className="bordered-container p2">
            <h3 className="h1 text-bold text-ellipsis">{title}</h3>

            <div>{price}</div>

            <p>{description}</p>

            <Button color="norm" size="large" fullWidth className="mb1" onClick={onSelect}>
                {c('Action').t`Select plan`}
            </Button>

            <ul className="unstyled mt0 mb0">
                {features.map(({ content, info }, index) => (
                    <li
                        className="subscriptionTable-feature flex flex-nowrap flex-align-items-center mt0-5"
                        key={index}
                    >
                        <Icon
                            name="check"
                            size={16}
                            className="mr1 flex-item-noshrink on-rtl-mirror"
                            style={{ color: 'var(--primary)' }}
                        />
                        {content}
                        {Boolean(info) && <Info className="ml0-5" title={info} />}
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

export default SubscriptionOption;

import { Children, type ReactElement, type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import generateUID from '@proton/utils/generateUID';

import './CondensedAddonsCard.scss';

// Checkout experiment CheckoutCondensedAddons: groups the Meet and Lumo addons into one card, one row each.
export const CondensedAddonsCard = ({ children }: { children: ReactNode }) => (
    <div className="condensed-addons-card border rounded-lg" data-testid="condensed-addons-card">
        {Children.map(children, (child) => (
            <div className="condensed-addons-card-row">{child}</div>
        ))}
    </div>
);

interface CondensedAddonRowProps {
    name: string;
    price: ReactElement;
    description: string;
    onAdd: () => void;
    testId: string;
}

export const CondensedAddonRow = ({ name, price, description, onAdd, testId }: CondensedAddonRowProps) => {
    const [open, setOpen] = useState(false);
    const [uid] = useState(() => generateUID('condensed-addon'));

    const label = c('Action').t`About ${name}`;
    const addLabel = c('Action').t`Add ${name}`;

    return (
        <div data-testid={testId}>
            <div className="flex flex-nowrap items-center gap-2">
                <span className="flex-1">
                    <strong>{name}</strong> <span className="color-weak">{price}</span>
                </span>
                <Button
                    shape="ghost"
                    size="small"
                    icon
                    pill
                    aria-expanded={open}
                    aria-controls={uid}
                    title={label}
                    onClick={() => setOpen((value) => !value)}
                >
                    <IcInfoCircle alt={label} />
                </Button>
                <Button
                    color="norm"
                    shape="outline"
                    className="shrink-0 flex items-center gap-1"
                    pill
                    aria-label={addLabel}
                    onClick={onAdd}
                >
                    <IcPlus className="shrink-0" />
                    <span data-testid={`${testId}-add-button`}>{c('Action').t`Add`}</span>
                </Button>
            </div>
            {open && (
                <p id={uid} className="m-0 mt-2 text-sm color-weak">
                    {description}
                </p>
            )}
        </div>
    );
};

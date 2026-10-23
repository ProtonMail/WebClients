import { Children, type ReactNode } from 'react';

import './CondensedAddonsCard.scss';

// Checkout experiment CheckoutCondensedAddons: groups the Meet and Lumo addons into one card, one row each.
export const CondensedAddonsCard = ({ children }: { children: ReactNode }) => (
    <div className="condensed-addons-card border rounded-lg" data-testid="condensed-addons-card">
        {Children.map(children, (child) => (
            <div className="condensed-addons-card-row">{child}</div>
        ))}
    </div>
);

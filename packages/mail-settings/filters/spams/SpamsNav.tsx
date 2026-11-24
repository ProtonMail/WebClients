import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import type { SpamNavItem } from './Spams.interfaces';

interface Props {
    onChange: (type: SpamNavItem) => void;
    selected: SpamNavItem;
}

const getNav = (): [type: SpamNavItem, getName: () => string][] => {
    return [
        ['ALL', () => c('Navigation').t`All`],
        ['SPAM', () => c('Navigation').t`Spam`],
        ['BLOCKED', () => c('Navigation').t`Block`],
        ['NON_SPAM', () => c('Navigation').t`Allow`],
    ];
};

const SpamFiltersNav = ({ selected, onChange }: Props) => (
    <ul className="unstyled block spam-filters-nav" role="tablist">
        {getNav().map(([type, getName]) => (
            <li
                key={type}
                className={clsx([
                    'relative inline-block border-bottom padding p-4 text-center',
                    selected !== type && 'color-weak',
                    selected === type && 'border-primary text-bold color-norm',
                ])}
                role="presentation"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={selected === type}
                    className="expand-click-area"
                    onClick={() => onChange(type)}
                >
                    {getName()}
                </button>
            </li>
        ))}
    </ul>
);

export default SpamFiltersNav;

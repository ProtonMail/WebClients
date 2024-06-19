import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { SpamNavItem } from './Spams.interfaces';

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
    <ul className="unstyled block spam-filters-nav">
        {getNav().map(([type, getName]) => (
            <li
                key={type}
                onClick={() => onChange(type)}
                className={clsx([
                    'cursor-pointer inline-block border-bottom padding p-4 text-center',
                    selected !== type && 'color-weak',
                    selected === type && 'border-primary text-bold color-norm',
                ])}
            >
                {getName()}
            </li>
        ))}
    </ul>
);

export default SpamFiltersNav;

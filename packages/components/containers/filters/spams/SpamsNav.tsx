import { c } from 'ttag';

import { classnames } from '@proton/components/helpers';

import { SpamNavItem } from './Spams.interfaces';

interface Props {
    onChange: (type: SpamNavItem) => void;
    selected: SpamNavItem;
    showBlockSender: boolean;
}

const getNav = (showBlockSender: boolean): [type: SpamNavItem, getName: () => string][] => {
    return [
        ['ALL', () => c('Navigation').t`All`],
        ['SPAM', () => c('Navigation').t`Spam`],
        ['NON_SPAM', () => c('Navigation').t`Not spam`],
        ...(showBlockSender
            ? [['BLOCKED', () => c('Navigation').t`Blocked`] as [type: SpamNavItem, getName: () => string]]
            : []),
    ];
};

const SpamFiltersNav = ({ selected, onChange, showBlockSender }: Props) => (
    <ul className="unstyled block">
        {getNav(showBlockSender).map(([type, getName]) => (
            <li
                key={type}
                onClick={() => onChange(type)}
                className={classnames([
                    'cursor-pointer inline-block border-bottom padding p1 text-center',
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

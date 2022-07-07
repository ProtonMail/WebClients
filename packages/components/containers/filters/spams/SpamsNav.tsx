import { c } from 'ttag';
import { classnames } from '@proton/components/helpers';
import { SpamNavItem } from './Spams.interfaces';

interface Props {
    onChange: (type: SpamNavItem) => void;
    selected: SpamNavItem;
}

const NAV: [type: SpamNavItem, getName: () => string][] = [
    ['ALL', () => c('Navigation').t`All`],
    ['SPAM', () => c('Navigation').t`Spam`],
    ['NON_SPAM', () => c('Navigation').t`Non spam`],
    ['BLOCKED', () => c('Navigation').t`Blocked`],
];

const SpamFiltersNav = ({ selected, onChange }: Props) => (
    <ul className="unstyled block">
        {NAV.map(([type, getName]) => (
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

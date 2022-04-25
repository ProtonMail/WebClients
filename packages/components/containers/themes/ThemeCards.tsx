import { ThemeTypes } from '@proton/shared/lib/themes/themes';

import ThemeCard from './ThemeCard';
import { classnames } from '../../helpers';

export interface Theme {
    label: string;
    identifier: ThemeTypes;
    thumb: string;
}
interface Props {
    themeIdentifier: ThemeTypes;
    className?: string;
    liClassName?: string;
    onChange: (themeType: ThemeTypes) => void;
    disabled?: boolean;
    list: Theme[];
}

const ThemeCards = ({ themeIdentifier, onChange, disabled, className, liClassName, list }: Props) => {
    return (
        <ul className={classnames(['unstyled m0', className])}>
            {list.map(({ identifier, label, thumb }) => {
                const id = `id_${identifier}`;
                return (
                    <li className={liClassName} key={label}>
                        <ThemeCard
                            label={label}
                            id={id}
                            src={thumb}
                            selected={themeIdentifier === identifier}
                            onChange={() => onChange(identifier)}
                            disabled={disabled}
                        />
                    </li>
                );
            })}
        </ul>
    );
};

export default ThemeCards;

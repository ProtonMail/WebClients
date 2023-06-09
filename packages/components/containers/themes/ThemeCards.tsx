import { ThemeTypes } from '@proton/shared/lib/themes/themes';
import clsx from '@proton/utils/clsx';

import ThemeCard from './ThemeCard';

export interface Theme {
    label: string;
    identifier: ThemeTypes;
    src: { medium: string; small: string };
}

interface Props {
    themeIdentifier: ThemeTypes;
    className?: string;
    liClassName?: string;
    onChange: (themeType: ThemeTypes) => void;
    disabled?: boolean;
    list: Theme[];
    size?: 'small' | 'medium';
}

const ThemeCards = ({ themeIdentifier, onChange, disabled, className, liClassName, list, size = 'medium' }: Props) => {
    return (
        <ul className={clsx(['unstyled m-0', className])}>
            {list.map(({ identifier, label, src }) => {
                const id = `id_${identifier}`;
                return (
                    <li className={liClassName} key={label}>
                        <ThemeCard
                            label={label}
                            id={id}
                            src={src[size]}
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

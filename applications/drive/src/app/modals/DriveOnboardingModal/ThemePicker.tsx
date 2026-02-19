import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { Theme } from '@proton/components/containers/themes/ThemeCards';
import ThemeSvg from '@proton/components/containers/themes/ThemeSvg';
import type { ThemeTypes } from '@proton/shared/lib/themes/constants';
import clsx from '@proton/utils/clsx';

type Props = {
    themeIdentifier: ThemeTypes;
    onChange: (themeType: ThemeTypes) => void;
    list: Theme[];
};

export const ThemePicker = ({ list, themeIdentifier, onChange }: Props) => {
    return (
        <ul
            className={'unstyled m-0 grid-auto-fill gap-4 max-w-3/4'}
            style={{ '--min-grid-template-column-size': `6rem` }}
        >
            {list.map(({ identifier, label, thumbColors }) => {
                const id = `id_${identifier}`;
                const selected = themeIdentifier === identifier;
                const size = 'small';

                return (
                    <li key={label}>
                        <Button
                            name="themeCard"
                            color="norm"
                            id={id}
                            className={clsx(
                                'p-2 flex flex-nowrap flex-column gap-1 items-start w-full rounded-lg border-2',
                                'relative interactive interactive--no-background',
                                selected ? 'border-primary pointer-events-none text-bold' : 'border-transparent'
                            )}
                            aria-pressed={selected}
                            onClick={() => onChange(identifier)}
                            type={'button'}
                            aria-label={c('Action').t`Use ${label} theme`}
                            title={c('Action').t`Use ${label} theme`}
                        >
                            <ThemeSvg
                                className={clsx('block rounded rtl:mirror', selected ? 'shadow-raised' : 'shadow-norm')}
                                size={size}
                                colors={thumbColors}
                            />
                            <span className={selected ? 'color-norm' : 'color-weak'}>{label}</span>
                        </Button>
                    </li>
                );
            })}
        </ul>
    );
};

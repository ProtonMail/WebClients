import { useEffect, useRef } from 'react';
import * as React from 'react';
import { scrollIntoView } from '@proton/shared/lib/helpers/dom';
import usePrevious from '../../hooks/usePrevious';
import { DropdownMenuButton } from '../dropdown';
import { classnames } from '../../helpers';

export interface Props<V> extends Omit<React.ComponentPropsWithoutRef<'button'>, 'value' | 'onChange' | 'title'> {
    value: V;
    onChange?: (value: V) => void;
    selected?: boolean;
    active?: boolean;
    title: string;
    disableFocusOnActive?: boolean;
    searchStrings?: string[];
}

const Option = <V,>({
    type = 'button',
    value,
    selected,
    active,
    onChange,
    title,
    children = title,
    disableFocusOnActive,
    searchStrings,
    ...rest
}: Props<V>) => {
    const ref = useRef<HTMLButtonElement | null>(null);
    const previousActive = usePrevious(active);

    useEffect(() => {
        if (!previousActive && active) {
            if (!disableFocusOnActive) {
                ref.current?.focus();
            } else {
                scrollIntoView(ref.current, { block: 'center' });
            }
        }
    }, [active]);

    const handleClick = () => {
        onChange?.(value);
    };

    return (
        <li className="dropdown-item">
            <DropdownMenuButton
                ref={ref}
                type={type}
                isSelected={selected}
                onClick={handleClick}
                title={title}
                className={classnames(['block w100 text-ellipsis text-left no-outline', active && 'active'])}
                {...rest}
            >
                {children}
            </DropdownMenuButton>
        </li>
    );
};

export default Option;

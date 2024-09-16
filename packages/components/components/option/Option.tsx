import type { ComponentPropsWithoutRef } from 'react';
import { useEffect, useRef } from 'react';

import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import usePrevious from '@proton/hooks/usePrevious';
import { scrollIntoView } from '@proton/shared/lib/helpers/dom';
import clsx from '@proton/utils/clsx';

export interface Props<V> extends Omit<ComponentPropsWithoutRef<'button'>, 'value' | 'onChange' | 'title'> {
    value: V;
    onChange?: (value: V) => void;
    selected?: boolean;
    active?: boolean;
    /**
     * Truncates and adds an ellipsis if the text exceeds the width of the dropdown.
     */
    truncate?: boolean;
    title: string;
    disableFocusOnActive?: boolean;
    searchStrings?: string[];
    preventScroll?: boolean;
}

const Option = <V,>({
    type = 'button',
    value,
    selected,
    active,
    truncate,
    onChange,
    title,
    children = title,
    disableFocusOnActive,
    searchStrings,
    className,
    preventScroll = false,
    ...rest
}: Props<V>) => {
    const ref = useRef<HTMLButtonElement | null>(null);
    const previousActive = usePrevious(active);

    useEffect(() => {
        if (!previousActive && active) {
            if (!disableFocusOnActive) {
                ref.current?.focus({ preventScroll });
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
                className={clsx([
                    className,
                    'block w-full text-left',
                    active && 'active',
                    truncate ? 'text-ellipsis' : 'text-break',
                ])}
                {...rest}
            >
                {children}
            </DropdownMenuButton>
        </li>
    );
};

export default Option;

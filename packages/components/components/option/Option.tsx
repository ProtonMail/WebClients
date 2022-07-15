import { ComponentPropsWithoutRef, useEffect, useRef } from 'react';
import { scrollIntoView } from '@proton/shared/lib/helpers/dom';
import usePrevious from '@proton/hooks/usePrevious';
import { DropdownMenuButton } from '../dropdown';
import { classnames } from '../../helpers';

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
                className={classnames([
                    className,
                    'block w100 text-left outline-none',
                    active && 'active',
                    truncate && 'text-ellipsis',
                ])}
                {...rest}
            >
                {children}
            </DropdownMenuButton>
        </li>
    );
};

export default Option;

import { forwardRef } from 'react';

import type { ButtonProps } from '@proton/atoms/Button/Button';
import noop from '@proton/utils/noop';

/** Wrap content in a button if onClick is set, skip it if not */
export const ButtonIfNeeded = forwardRef<HTMLButtonElement, ButtonProps>(({ onClick, ...rest }, ref) =>
    onClick === noop || !onClick ? rest.children : <button ref={ref} onClick={onClick} {...rest} />
);

ButtonIfNeeded.displayName = 'ButtonIfNeeded';

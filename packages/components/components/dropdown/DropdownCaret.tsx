import type { ReactElement } from 'react';

import { IcChevronDownFilled } from '@proton/icons/icons/IcChevronDownFilled';
import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
    isOpen?: boolean;
    icon?: ReactElement;
    caretAlt?: string;
}
const DropdownCaret = ({ className, isOpen, icon = <IcChevronDownFilled />, caretAlt }: Props) => {
    return (
        <span className={clsx(['flex', isOpen && 'rotateX-180', className])}>
            {icon}
            {caretAlt ? <span className="sr-only">{caretAlt}</span> : null}
        </span>
    );
};

export default DropdownCaret;

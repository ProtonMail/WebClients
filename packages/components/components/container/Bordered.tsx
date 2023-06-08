import { ComponentPropsWithoutRef, Ref, forwardRef } from 'react';

import clsx from '@proton/utils/clsx';

type Props = ComponentPropsWithoutRef<'div'>;

const Bordered = ({ children, className: classNameProp, ...rest }: Props, ref: Ref<HTMLDivElement>) => {
    const className = clsx(classNameProp, 'border p-4 mb-4');

    return (
        <div ref={ref} className={className} {...rest}>
            {children}
        </div>
    );
};

export default forwardRef<HTMLDivElement, Props>(Bordered);

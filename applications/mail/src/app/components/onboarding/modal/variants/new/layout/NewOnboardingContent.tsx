import type { ReactNode } from 'react';

import { useActiveBreakpoint } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';

export interface Props {
    description?: ReactNode;
    children?: ReactNode;
    title?: ReactNode;
    /** classes wrapper surrounding title only or title + description block */
    titleBlockClassName?: string;
    /** overall wrapper classname */
    className?: string;
}

const NewOnboardingContent = ({ description, children, title, titleBlockClassName = 'mb-12', ...rest }: Props) => {
    const { viewportWidth } = useActiveBreakpoint();

    return (
        <div {...rest}>
            {!!(title || description) && (
                <div className={clsx('text-center', titleBlockClassName)}>
                    {title && (
                        <h1 className={clsx('text-4xl text-bold', !viewportWidth['<=small'] && 'px-4')}>{title}</h1>
                    )}
                    {description && <div className="color-weak">{description}</div>}
                </div>
            )}
            {children && <div>{children}</div>}
        </div>
    );
};

export default NewOnboardingContent;

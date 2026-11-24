import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props {
    label: ReactNode;
    /** Id of the control the label is for. Without it, the label is rendered as plain text with `labelId`. */
    htmlFor?: string;
    labelId?: string;
    className?: string;
    children: ReactNode;
}

/** A form field with its label stacked above the control. */
const AutoReplyField = ({ label, htmlFor, labelId, className, children }: Props) => {
    return (
        <div className={clsx('flex flex-column flex-nowrap gap-1', className)}>
            {htmlFor ? (
                <label htmlFor={htmlFor} id={labelId} className="text-semibold">
                    {label}
                </label>
            ) : (
                <span id={labelId} className="text-semibold">
                    {label}
                </span>
            )}
            {/* Block wrapper: the inputs carry `flex-1`, which would collapse them in this column */}
            <div>{children}</div>
        </div>
    );
};

export default AutoReplyField;

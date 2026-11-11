import type { ReactNode } from 'react';

import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import clsx from '@proton/utils/clsx';

interface Props {
    label: ReactNode;
    description?: ReactNode;
    /** Id of the control in `children` that the label names */
    htmlFor?: string;
    /** Read-only value shown on the right */
    value?: ReactNode;
    /** Makes the whole row a button with a chevron, to open another page */
    onClick?: () => void;
    /** Puts `children` below the label at full width, for controls too wide for the right side such as a text field */
    stacked?: boolean;
    /** Control shown on the right, such as a toggle or an unstyled select */
    children?: ReactNode;
}

/** One line of a lite settings panel, from the Figma `settings/row` component */
const LiteSettingsRow = ({ label, description, htmlFor, value, onClick, stacked, children }: Props) => {
    const text = (
        <span className="lite-settings-row-text">
            {htmlFor ? (
                <label htmlFor={htmlFor} id={`${htmlFor}-label`} className="lite-settings-row-label">
                    {label}
                </label>
            ) : (
                <span className="lite-settings-row-label">{label}</span>
            )}
            {description && <span className="lite-settings-row-description">{description}</span>}
        </span>
    );
    const trailing = (
        <>
            {value !== undefined && <span className="lite-settings-row-value">{value}</span>}
            {children && <div className="lite-settings-row-control">{children}</div>}
        </>
    );

    if (onClick) {
        return (
            <button type="button" className="lite-settings-row lite-settings-row--button" onClick={onClick}>
                {text}
                {trailing}
                <IcChevronRight className="lite-settings-row-chevron shrink-0" size={5} />
            </button>
        );
    }

    return (
        <div className={clsx('lite-settings-row', stacked && 'lite-settings-row--stacked')}>
            {text}
            {trailing}
        </div>
    );
};

export default LiteSettingsRow;

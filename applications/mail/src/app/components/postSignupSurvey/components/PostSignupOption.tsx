import type { ReactNode } from 'react';

import { Input } from '@proton/atoms/Input/Input';

interface Props {
    label: string;
    checked: boolean;
    /** Renders the radio or checkbox. Receives the label as children. */
    renderControl: (children: string) => ReactNode;
    /** When set, a detail input is shown while the option is checked. */
    detailPlaceholder?: string;
    detail: string;
    onDetailChange: (value: string) => void;
}

export const PostSignupOption = ({
    label,
    checked,
    renderControl,
    detailPlaceholder,
    detail,
    onDetailChange,
}: Props) => {
    return (
        <>
            {renderControl(label)}
            {checked && detailPlaceholder !== undefined && (
                <div>
                    <Input
                        autoFocus
                        placeholder={detailPlaceholder}
                        maxLength={250}
                        value={detail}
                        onChange={(e) => onDetailChange(e.target.value)}
                        aria-label={label}
                    />
                </div>
            )}
        </>
    );
};

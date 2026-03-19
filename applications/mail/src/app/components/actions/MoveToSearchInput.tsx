import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import type { ChangeEventHandler } from 'react';

import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';

interface Props {
    title: string;
    placeholder: string;
    value: string;
    onChange: ChangeEventHandler<HTMLInputElement>;
}

export const MoveToSearchInput = ({ title, placeholder, value, onChange }: Props) => {
    const breakpoints = useActiveBreakpoint();

    return (
        <InputFieldTwo
            dense
            id="search-input"
            data-testid="move-to-search-input"
            unstyled
            labelContainerClassName="color-weak text-sm"
            inputContainerClassName="border-bottom border-primary"
            value={value}
            onChange={onChange}
            label={title}
            data-prevent-arrow-navigation
            assistContainerClassName="h-2"
            prefix={<IcMagnifier />}
            placeholder={placeholder}
            autoFocus={!breakpoints.viewportWidth['<=small']}
        />
    );
};

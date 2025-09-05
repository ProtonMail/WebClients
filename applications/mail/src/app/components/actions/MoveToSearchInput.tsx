import type { ChangeEventHandler } from 'react';

import { Icon, InputFieldTwo, useActiveBreakpoint } from '@proton/components';

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
            prefix={<Icon name="magnifier" />}
            placeholder={placeholder}
            autoFocus={!breakpoints.viewportWidth['<=small']}
        />
    );
};

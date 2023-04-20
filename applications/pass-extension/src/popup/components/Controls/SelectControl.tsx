import type { VFC } from 'react';

import { SelectTwo } from '@proton/components/index';

import { InputControl, type InputControlProps } from './InputControl';

export type Props = InputControlProps<typeof SelectTwo>;

export const SelectControl: VFC<Props> = (props) => {
    return (
        <InputControl<typeof SelectTwo>
            as={SelectTwo}
            rootClassName="static"
            caretIconName="chevron-down"
            labelContainerClassName="increase-click-surface color-weak text-normal text-sm"
            unstyled
            renderSelected={props.loading ? () => <div className="pass-skeleton pass-skeleton--select" /> : undefined}
            {...props}
        />
    );
};

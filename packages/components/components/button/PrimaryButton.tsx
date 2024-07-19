import type { Ref } from 'react';
import { forwardRef } from 'react';

import type { ButtonProps } from '@proton/atoms';
import { Button } from '@proton/atoms';

export type PrimaryButtonProps = Omit<ButtonProps, 'color'>;

const PrimaryButton = (props: PrimaryButtonProps, ref: Ref<HTMLButtonElement>) => {
    return <Button color="norm" ref={ref} {...props} />;
};

export default forwardRef<HTMLButtonElement, PrimaryButtonProps>(PrimaryButton);

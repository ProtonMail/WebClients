import { Ref, forwardRef } from 'react';

import { Button, ButtonProps } from '@proton/atoms';

export type PrimaryButtonProps = Omit<ButtonProps, 'color'>;

const PrimaryButton = (props: PrimaryButtonProps, ref: Ref<HTMLButtonElement>) => {
    return <Button color="norm" ref={ref} {...props} />;
};

export default forwardRef<HTMLButtonElement, PrimaryButtonProps>(PrimaryButton);

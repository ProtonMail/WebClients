import { Ref, forwardRef } from 'react';

import { Button, ButtonProps } from '@proton/atoms';

export type UnderlineButtonProps = Omit<ButtonProps, 'shape'>;

const UnderlineButton = (props: UnderlineButtonProps, ref: Ref<HTMLButtonElement>) => {
    return <Button shape="underline" color="norm" ref={ref} {...props} />;
};

export default forwardRef<HTMLButtonElement, UnderlineButtonProps>(UnderlineButton);

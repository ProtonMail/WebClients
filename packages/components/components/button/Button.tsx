import * as React from 'react';

import ButtonLike, { ButtonLikeProps } from './ButtonLike';

export interface ButtonProps extends Omit<ButtonLikeProps<'button'>, 'as' | 'ref'> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (props: ButtonProps, ref: React.Ref<HTMLButtonElement>) => {
        return <ButtonLike type="button" ref={ref} {...props} as="button" />;
    }
);

export default Button;

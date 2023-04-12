import { Ref, forwardRef } from 'react';

import ButtonLike, { ButtonLikeProps } from './ButtonLike';

export interface ButtonProps extends Omit<ButtonLikeProps<'button'>, 'as' | 'ref'> {}

const ButtonBase = (props: ButtonProps, ref: Ref<HTMLButtonElement>) => {
    return <ButtonLike type="button" ref={ref} {...props} as="button" />;
};

/*
export because of
https://github.com/storybookjs/storybook/issues/9511
https://github.com/styleguidist/react-docgen-typescript/issues/314
https://github.com/styleguidist/react-docgen-typescript/issues/215
*/
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(ButtonBase);

import { memo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ButtonProps } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import { SubTheme } from '@proton/pass/components/Layout/Theme/types';

import { usePasswordGeneratorAction } from './PasswordGeneratorAction';

type Props = Omit<ButtonProps, 'onSubmit'> & { onSubmit: (password: string) => void };

export const PasswordGeneratorButton = memo(({ onSubmit, type, ...rest }: Props) => {
    const generate = usePasswordGeneratorAction();

    const handleOnClick = () =>
        generate({
            onSubmit,
            actionLabel: c('Action').t`Fill password`,
            className: SubTheme.VIOLET,
        });

    return (
        <Button
            icon
            pill
            color="weak"
            shape="solid"
            size="medium"
            className="pass-item-icon"
            title={c('Action').t`Generate password`}
            onClick={handleOnClick}
            {...rest}
        >
            <Icon name="arrows-rotate" size={5} />
        </Button>
    );
});

PasswordGeneratorButton.displayName = 'PasswordGeneratorButtonMemo';

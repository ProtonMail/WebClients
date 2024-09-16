import { type FC, memo } from 'react';

import { c } from 'ttag';

import { Button, type ButtonProps } from '@proton/atoms';
import { Icon } from '@proton/components';
import { SubTheme } from '@proton/pass/components/Layout/Theme/types';

import { usePasswordContext } from './PasswordContext';

type Props = Omit<ButtonProps, 'onSubmit'> & { onSubmit: (password: string) => void };

const PasswordGeneratorButtonRaw: FC<Props> = ({ onSubmit, type, ...rest }) => {
    const passwordContext = usePasswordContext();

    const handleOnClick = () =>
        passwordContext.generate({
            onSubmit,
            actionLabel: c('Action').t`Fill password`,
            className: SubTheme.VIOLET /* no-need for a type prop yet: only used for Login items */,
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
};

export const PasswordGeneratorButton = memo(PasswordGeneratorButtonRaw);

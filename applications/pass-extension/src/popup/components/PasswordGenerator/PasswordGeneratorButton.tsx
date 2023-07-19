import { type VFC, memo } from 'react';

import { c } from 'ttag';

import { Button, type ButtonProps } from '@proton/atoms';
import { Icon } from '@proton/components/components';

import { SubTheme } from '../../../shared/theme/sub-theme';
import { usePasswordContext } from './PasswordContext';

type Props = Omit<ButtonProps, 'onSubmit'> & { onSubmit: (password: string) => void };

const PasswordGeneratorButtonRaw: VFC<Props> = ({ onSubmit, type, ...rest }) => {
    const { generatePassword } = usePasswordContext();
    const handleOnClick = () =>
        generatePassword({
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
            <Icon name="arrows-rotate" size={20} />
        </Button>
    );
};

export const PasswordGeneratorButton = memo(PasswordGeneratorButtonRaw);

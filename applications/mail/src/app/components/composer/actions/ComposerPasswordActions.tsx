import { c } from 'ttag';

import { Button, Kbd } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { clearBit } from '@proton/shared/lib/helpers/bitset';
import { metaKey, shiftKey } from '@proton/shared/lib/helpers/browser';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import clsx from '@proton/utils/clsx';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { MessageChange } from '../Composer';
import ComposerMoreOptionsDropdown from './ComposerMoreOptionsDropdown';

interface Props {
    isPassword: boolean;
    onChange: MessageChange;
    onPassword: () => void;
}

const ComposerPasswordActions = ({ isPassword, onChange, onPassword }: Props) => {
    const { Shortcuts } = useMailModel('MailSettings');

    const titleEncryption = Shortcuts ? (
        <>
            {c('Title').t`External encryption`}
            <br />
            <Kbd shortcut={metaKey} /> + <Kbd shortcut={shiftKey} /> + <Kbd shortcut="E" />
        </>
    ) : (
        c('Title').t`External encryption`
    );

    const handleRemoveOutsideEncryption = () => {
        onChange(
            (message) => ({
                data: {
                    Flags: clearBit(message.data?.Flags, MESSAGE_FLAGS.FLAG_INTERNAL),
                    Password: undefined,
                    PasswordHint: undefined,
                },
                draftFlags: {
                    expiresIn: undefined,
                },
            }),
            true
        );
    };

    if (isPassword) {
        return (
            <ComposerMoreOptionsDropdown
                title={c('Title').t`External encryption`}
                titleTooltip={c('Title').t`External encryption`}
                className="button button-for-icon composer-more-dropdown"
                data-testid="composer:encryption-options-button"
                content={
                    <Icon
                        name="lock"
                        className={clsx([isPassword && 'color-primary'])}
                        alt={c('Action').t`External encryption`}
                    />
                }
            >
                <DropdownMenuButton
                    className="text-left flex flex-nowrap items-center"
                    onClick={onPassword}
                    data-testid="composer:edit-outside-encryption"
                >
                    <Icon name="lock" />
                    <span className="ml-2 my-auto flex-1">{c('Action').t`Edit encryption`}</span>
                </DropdownMenuButton>
                <DropdownMenuButton
                    className="text-left flex flex-nowrap items-center color-danger"
                    onClick={handleRemoveOutsideEncryption}
                    data-testid="composer:remove-outside-encryption"
                >
                    <Icon name="trash" />
                    <span className="ml-2 my-auto flex-1">{c('Action').t`Remove encryption`}</span>
                </DropdownMenuButton>
            </ComposerMoreOptionsDropdown>
        );
    }

    return (
        <Tooltip title={titleEncryption}>
            <Button
                icon
                color={isPassword ? 'norm' : undefined}
                shape="ghost"
                data-testid="composer:password-button"
                onClick={onPassword}
                className="mr-1 sm:mr-2"
                aria-pressed={isPassword}
            >
                <Icon name="lock" alt={c('Action').t`Encryption`} />
            </Button>
        </Tooltip>
    );
};

export default ComposerPasswordActions;

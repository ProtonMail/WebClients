import { c } from 'ttag';

import { Button, Icon, Tooltip, classnames, useMailSettings } from '@proton/components';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { clearBit } from '@proton/shared/lib/helpers/bitset';
import { metaKey, shiftKey } from '@proton/shared/lib/helpers/browser';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';

import { MessageChange } from '../Composer';
import ComposerMoreOptionsDropdown from './ComposerMoreOptionsDropdown';

interface Props {
    isPassword: boolean;
    onChange: MessageChange;
    onPassword: () => void;
}

const ComposerPasswordActions = ({ isPassword, onChange, onPassword }: Props) => {
    const [{ Shortcuts = 0 } = {}] = useMailSettings();

    const titleEncryption = Shortcuts ? (
        <>
            {c('Title').t`External encryption`}
            <br />
            <kbd className="border-none">{metaKey}</kbd> + <kbd className="border-none">{shiftKey}</kbd> +{' '}
            <kbd className="border-none">E</kbd>
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
                        className={classnames([isPassword && 'color-primary'])}
                        alt={c('Action').t`External encryption`}
                    />
                }
            >
                <DropdownMenuButton
                    className="text-left flex flex-nowrap flex-align-items-center"
                    onClick={onPassword}
                    data-testid="composer:edit-outside-encryption"
                >
                    <Icon name="lock" />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Edit encryption`}</span>
                </DropdownMenuButton>
                <DropdownMenuButton
                    className="text-left flex flex-nowrap flex-align-items-center color-danger"
                    onClick={handleRemoveOutsideEncryption}
                    data-testid="composer:remove-outside-encryption"
                >
                    <Icon name="trash" />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Remove encryption`}</span>
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
                className="mr0-5"
                aria-pressed={isPassword}
            >
                <Icon name="lock" alt={c('Action').t`Encryption`} />
            </Button>
        </Tooltip>
    );
};

export default ComposerPasswordActions;

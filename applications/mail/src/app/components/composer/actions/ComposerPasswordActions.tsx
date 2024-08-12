import { c } from 'ttag';

import { Button, Kbd } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { metaKey, shiftKey } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import useMailModel from 'proton-mail/hooks/useMailModel';

import ComposerMoreOptionsDropdown from './ComposerMoreOptionsDropdown';

interface Props {
    isPassword: boolean;
    onPassword: () => void;
    onRemoveOutsideEncryption: () => void;
}

const ComposerPasswordActions = ({ isPassword, onRemoveOutsideEncryption, onPassword }: Props) => {
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
                    onClick={onRemoveOutsideEncryption}
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
                aria-pressed={isPassword}
            >
                <Icon name="lock" alt={c('Action').t`Encryption`} />
            </Button>
        </Tooltip>
    );
};

export default ComposerPasswordActions;

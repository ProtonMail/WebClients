import type { MutableRefObject } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import type { EditorMetadata } from '@proton/components';
import { DropdownMenuButton, Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { useMailDispatch } from '../../../store/hooks';
import { updateExpires } from '../../../store/messages/draft/messagesDraftActions';
import type { MessageState } from '../../../store/messages/messagesTypes';
import type { MessageChange, MessageChangeFlag } from '../Composer';
import type { ExternalEditorActions } from '../editor/EditorWrapper';
import ComposerMoreOptionsDropdown from './ComposerMoreOptionsDropdown';
import MoreActionsExtension from './MoreActionsExtension';

interface Props {
    isExpiration: boolean;
    message: MessageState;
    onExpiration: () => void;
    lock: boolean;
    onChangeFlag: MessageChangeFlag;
    editorActionsRef: MutableRefObject<ExternalEditorActions | undefined>;
    editorMetadata: EditorMetadata;
    onChange: MessageChange;
    isSmallViewport: boolean;
    isPassword: boolean;
    onPassword: () => void;
    onRemoveOutsideEncryption: () => void;
    onDelete: () => void;
}

const ComposerMoreActions = ({
    isExpiration,
    message,
    onExpiration,
    lock,
    onChangeFlag,
    editorActionsRef,
    editorMetadata,
    onChange,
    isSmallViewport,
    isPassword,
    onPassword,
    onRemoveOutsideEncryption,
    onDelete,
}: Props) => {
    const dispatch = useMailDispatch();
    const titleMoreOptions = c('Title').t`More options`;

    const toolbarExtension = useMemo(
        () => (
            <MoreActionsExtension
                message={message}
                onChangeFlag={onChangeFlag}
                editorActionsRef={editorActionsRef}
                editorMetadata={editorMetadata}
                onChange={onChange}
            />
        ),
        [message.data, onChangeFlag]
    );

    const handleRemoveExpiration = () => {
        onChange({ draftFlags: { expiresIn: undefined } });
        dispatch(updateExpires({ ID: message?.localID || '', expiresIn: undefined }));
    };

    const dotsInColor = isExpiration || isPassword;

    return (
        <ComposerMoreOptionsDropdown
            titleTooltip={titleMoreOptions}
            className="button button-medium button-ghost-weak button-for-icon composer-more-dropdown"
            content={
                <Icon
                    name="three-dots-horizontal"
                    alt={titleMoreOptions}
                    className={clsx([dotsInColor && 'color-primary'])}
                />
            }
        >
            {toolbarExtension}
            <div className="dropdown-item-hr" key="hr-more-options" />
            <DropdownMenuButton
                className="text-left flex flex-nowrap items-center"
                onClick={onExpiration}
                aria-pressed={isExpiration}
                disabled={lock}
                data-testid="composer:expiration-button"
            >
                <Icon name="hourglass" />
                <span className="ml-2 my-auto flex-1">
                    {isExpiration ? c('Action').t`Set expiration time` : c('Action').t`Expiration time`}
                </span>
            </DropdownMenuButton>

            {isExpiration && (
                <DropdownMenuButton
                    className="text-left flex flex-nowrap items-center color-danger"
                    onClick={handleRemoveExpiration}
                    aria-pressed={isExpiration}
                    disabled={lock}
                    data-testid="composer:remove-expiration-button"
                >
                    <Icon name="trash" />
                    <span className="ml-2 my-auto flex-1">{c('Action').t`Remove expiration time`}</span>
                </DropdownMenuButton>
            )}

            {isSmallViewport && (
                <>
                    <div className="dropdown-item-hr" key="hr-more-options" />

                    <DropdownMenuButton
                        className="text-left flex flex-nowrap items-center"
                        onClick={onPassword}
                        aria-pressed={isPassword}
                        data-testid="composer:encryption-button"
                    >
                        <Icon name="lock" />
                        <span className="ml-2 my-auto flex-1">
                            {isPassword ? c('Action').t`Edit encryption` : c('Action').t`External encryption`}
                        </span>
                    </DropdownMenuButton>

                    {isPassword && (
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap items-center color-danger"
                            onClick={onRemoveOutsideEncryption}
                            aria-pressed={isPassword}
                            data-testid="composer:remove-encryption-button"
                        >
                            <Icon name="trash" />
                            <span className="ml-2 my-auto flex-1">{c('Action').t`Remove encryption`}</span>
                        </DropdownMenuButton>
                    )}

                    <div className="dropdown-item-hr" key="hr-more-options" />

                    <DropdownMenuButton
                        className="text-left flex flex-nowrap items-center"
                        onClick={onDelete}
                        data-testid="composer:delete-draft-button"
                    >
                        <Icon name="trash" />
                        <span className="ml-2 my-auto flex-1">{c('Action').t`Delete draft`}</span>
                    </DropdownMenuButton>
                </>
            )}
        </ComposerMoreOptionsDropdown>
    );
};

export default ComposerMoreActions;

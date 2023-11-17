import { MutableRefObject, useMemo } from 'react';

import { c } from 'ttag';

import { EditorMetadata, Icon } from '@proton/components';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import clsx from '@proton/utils/clsx';

import { MessageState } from '../../../logic/messages/messagesTypes';
import { MessageChange, MessageChangeFlag } from '../Composer';
import { ExternalEditorActions } from '../editor/EditorWrapper';
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
}: Props) => {
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
    };

    return (
        <ComposerMoreOptionsDropdown
            title={titleMoreOptions}
            titleTooltip={titleMoreOptions}
            className="button button-for-icon composer-more-dropdown"
            content={
                <Icon
                    name="three-dots-horizontal"
                    alt={titleMoreOptions}
                    className={clsx([isExpiration && 'color-primary'])}
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
                <span className="ml-2 my-auto flex-item-fluid">
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
                    <span className="ml-2 my-auto flex-item-fluid">{c('Action').t`Remove expiration time`}</span>
                </DropdownMenuButton>
            )}
        </ComposerMoreOptionsDropdown>
    );
};

export default ComposerMoreActions;

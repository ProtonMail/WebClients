import { useEffect, useState } from 'react';

import { c } from 'ttag';

import Alert from '@proton/components/components/alert/Alert';
import Editor from '@proton/components/components/editor/Editor';
import { useToolbar } from '@proton/components/components/editor/hooks/useToolbar';
import type { EditorActions } from '@proton/components/components/editor/interface';
import Toggle from '@proton/components/components/toggle/Toggle';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { AUTO_REPLY_CHARACTER_COUNT_LIMIT } from '@proton/shared/lib/mail/constants';
import noop from '@proton/utils/noop';

import { useMailSettings, useUser } from '../../../hooks';
import type { Actions } from '../interfaces';

interface Props {
    actions: Actions;
    handleUpdateActions: (onUpdateActions: Partial<Actions>) => void;
    isEdit: boolean;
}

const FilterActionsFormAutoReplyRow = ({ isEdit, actions, handleUpdateActions }: Props) => {
    const [user] = useUser();
    const [mailSettings] = useMailSettings();
    const { autoReply } = actions;
    const [editorVisible, setEditorVisible] = useState(!!autoReply);
    const [editorValue, setEditorValue] = useState(autoReply || '');

    const handleReady = (editorActions: EditorActions) => {
        editorActions.setContent(editorValue);

        if (!isEdit) {
            editorActions.focus();
        }
    };

    useEffect(() => {
        handleUpdateActions({ autoReply: editorVisible ? editorValue : '' });
    }, [editorVisible]);

    const { openEmojiPickerRef, toolbarConfig, setToolbarConfig, modalLink, modalImage, modalDefaultFont } = useToolbar(
        {}
    );

    return (
        <>
            <div
                className="flex flex-nowrap flex-column md:flex-row align-items-center pt-4 gap-4"
                data-testid="filter-modal:auto-reply-row"
            >
                {user.hasPaidMail ? (
                    <>
                        <label htmlFor="autoReply" className="w-full md:w-1/4 pt-2">
                            <span>{c('Label').t`Send auto-reply`}</span>
                        </label>
                        <div className="flex flex-column w-full pt-2">
                            <Toggle
                                id="autoReply"
                                checked={editorVisible}
                                onChange={() => {
                                    setEditorVisible((editorVisible) => !editorVisible);
                                }}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-full md:w-1/4 pt-2">
                            <span className="mx-2">{c('Label').t`Send auto-reply`}</span>
                        </div>
                        <Tooltip title={c('Tooltip').t`This feature is only available for paid users`}>
                            <span>
                                <Toggle disabled checked={false} onChange={noop} />
                            </span>
                        </Tooltip>
                    </>
                )}
            </div>
            {editorVisible && user.hasPaidMail && (
                <>
                    {actions && actions.autoReply && actions.autoReply.length > AUTO_REPLY_CHARACTER_COUNT_LIMIT && (
                        <Alert className="my-4" type="error">
                            {c('Error').t`You've reached the maximum character number. Please shorten your message.`}
                        </Alert>
                    )}
                    <div className="w-full mt-4">
                        <Editor
                            onReady={handleReady}
                            metadata={{ supportImages: false }}
                            onChange={(value: string) => {
                                setEditorValue(value);
                                handleUpdateActions({ autoReply: value });
                            }}
                            simple
                            openEmojiPickerRef={openEmojiPickerRef}
                            toolbarConfig={toolbarConfig}
                            setToolbarConfig={setToolbarConfig}
                            modalLink={modalLink}
                            modalImage={modalImage}
                            modalDefaultFont={modalDefaultFont}
                            mailSettings={mailSettings}
                        />
                    </div>
                </>
            )}
        </>
    );
};

export default FilterActionsFormAutoReplyRow;

import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useToolbar } from '@proton/components/components/editor/hooks/useToolbar';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { Editor, EditorActions, Toggle, Tooltip } from '../../../components';
import { useUser } from '../../../hooks';
import { Actions } from '../interfaces';

interface Props {
    isNarrow: boolean;
    actions: Actions;
    handleUpdateActions: (onUpdateActions: Partial<Actions>) => void;
    isEdit: boolean;
}

const FilterActionsFormAutoReplyRow = ({ isEdit, isNarrow, actions, handleUpdateActions }: Props) => {
    const [user] = useUser();
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
                className="flex flex-nowrap on-mobile-flex-column align-items-center pt-4 "
                data-testid="filter-modal:auto-reply-row"
            >
                {user.hasPaidMail ? (
                    <>
                        <label htmlFor="autoReply" className={clsx(['w20 pt-2', isNarrow && 'mb-4'])}>
                            <span className={clsx([!isNarrow && 'ml-4'])}>{c('Label').t`Send auto-reply`}</span>
                        </label>
                        <div className={clsx(['flex flex-column flex-item-fluid pt-2', !isNarrow && 'ml-4'])}>
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
                        <div className={clsx(['w20 mr-4 pt-2', isNarrow && 'mb-4'])}>
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
                <div className="w100 mt-4">
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
                    />
                </div>
            )}
        </>
    );
};

export default FilterActionsFormAutoReplyRow;

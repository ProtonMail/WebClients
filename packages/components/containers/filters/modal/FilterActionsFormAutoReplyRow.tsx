import { useState, useEffect } from 'react';
import { c } from 'ttag';

import { noop } from '@proton/shared/lib/helpers/function';

import { Toggle, Tooltip, Editor, EditorActions } from '../../../components';
import { useUser } from '../../../hooks';
import { classnames } from '../../../helpers';
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

    return (
        <div className="flex flex-nowrap on-mobile-flex-column align-items-center pt1 pb1">
            {user.hasPaidMail ? (
                <>
                    <label htmlFor="autoReply" className={classnames(['w20 pt0-5', isNarrow && 'mb1'])}>
                        <span className={classnames([!isNarrow && 'ml1'])}>{c('Label').t`Send auto-reply`}</span>
                    </label>
                    <div className={classnames(['flex flex-column flex-item-fluid', !isNarrow && 'ml1'])}>
                        <Toggle
                            id="autoReply"
                            checked={editorVisible}
                            onChange={() => {
                                setEditorVisible((editorVisible) => !editorVisible);
                            }}
                        />
                        {editorVisible && (
                            <div className="w100 mt1">
                                <Editor
                                    onReady={handleReady}
                                    metadata={{ supportImages: false }}
                                    onChange={(value: string) => {
                                        setEditorValue(value);
                                        handleUpdateActions({ autoReply: value });
                                    }}
                                    simple
                                />
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className={classnames(['w20 mr1 pt0-5', isNarrow && 'mb1'])}>
                        <span className="ml0-5 mr0-5">{c('Label').t`Send auto-reply`}</span>
                    </div>
                    <Tooltip title={c('Tooltip').t`This feature is only available for paid users`}>
                        <span>
                            <Toggle disabled checked={false} onChange={noop} />
                        </span>
                    </Tooltip>
                </>
            )}
        </div>
    );
};

export default FilterActionsFormAutoReplyRow;

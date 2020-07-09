import React, { useRef, useState, useEffect } from 'react';
import { c } from 'ttag';

import { classnames, Toggle, Tooltip, SimpleSquireEditor, useUser } from '../../..';
import { noop } from 'proton-shared/lib/helpers/function';
import { Actions } from 'proton-shared/lib/filters/interfaces';

import { SquireEditorRef } from '../../../components/editor/SquireEditor';

interface Props {
    isNarrow: boolean;
    actions: Actions;
    handleUpdateActions: (onUpdateActions: Partial<Actions>) => void;
    isEdit: boolean;
}

const FilterActionsFormAutoReplyRow = ({ isEdit, isNarrow, actions, handleUpdateActions }: Props) => {
    const [user] = useUser();
    const editorRef = useRef<SquireEditorRef>(null);
    const { autoReply } = actions;
    const [editorVisible, setEditorVisible] = useState(!!autoReply);
    const [editorValue, setEditorValue] = useState(autoReply || '');

    const handleReady = () => {
        if (editorRef.current) {
            editorRef.current.value = editorValue;

            if (!isEdit) {
                editorRef.current.focus();
            }
        }
    };

    useEffect(() => {
        handleUpdateActions({ autoReply: editorVisible ? editorValue : '' });
    }, [editorVisible]);

    return (
        <div className="flex flex-nowrap onmobile-flex-column align-items-center pt1 pb1">
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
                                <SimpleSquireEditor
                                    ref={editorRef}
                                    onReady={handleReady}
                                    onChange={(value: string) => {
                                        setEditorValue(value);
                                        handleUpdateActions({ autoReply: value });
                                    }}
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
                        <Toggle disabled checked={false} onChange={noop} />
                    </Tooltip>
                </>
            )}
        </div>
    );
};

export default FilterActionsFormAutoReplyRow;

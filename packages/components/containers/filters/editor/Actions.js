import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { buildTreeview, formatFolderName } from 'proton-shared/lib/helpers/folder';
import { Loader, Label, Field, Select, Row, useLabels, useFolders, ErrorZone } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { toMap } from 'proton-shared/lib/helpers/object';

import LabelActions from './LabelActions';
import AutoReplyAction from './AutoReplyAction';

const formatOption = ({ Path, Name }, level = 0) => ({
    value: Path,
    text: formatFolderName(level, Name, ' ∙ '),
    group: c('Option group').t`Custom folders`
});

const reducer = (acc = [], folder, level = 0) => {
    acc.push(formatOption(folder, level));

    if (Array.isArray(folder.subfolders)) {
        folder.subfolders.forEach((folder) => reducer(acc, folder, level + 1));
    }

    return acc;
};

function ActionsEditor({ filter, onChange = noop, errors = {} }) {
    const { Actions } = filter.Simple;
    const [labels, loadingLabels] = useLabels();
    const [folders = [], loadingFolders] = useFolders();
    const labelsMap = toMap(labels, 'Path');
    const treeview = buildTreeview(folders);

    const MOVE_TO = [
        {
            group: c('Option group').t`Action`,
            text: c('Filter Actions').t`Move to ...`,
            value: ''
        },
        {
            group: c('Option group').t`Default folders`,
            text: c('Filter Actions').t`Archive`,
            value: 'archive'
        },
        {
            group: c('Option group').t`Default folders`,
            text: c('Filter Actions').t`Inbox`,
            value: 'inbox'
        },
        {
            group: c('Option group').t`Default folders`,
            text: c('Filter Actions').t`Spam`,
            value: 'spam'
        },
        {
            group: c('Option group').t`Default folders`,
            text: c('Filter Actions').t`Trash`,
            value: 'trash'
        }
    ].concat(treeview.reduce((acc, folder) => reducer(acc, folder), []));

    const MARK_AS = [
        {
            text: c('Filter Actions').t`Mark as ...`
        },
        {
            text: c('Filter Actions').t`Mark as read`,
            value: 'read'
        },
        {
            text: c('Filter Actions').t`Mark as starred`,
            value: 'starred'
        }
    ];

    const ACTIONS = {
        markAs: (value) => ({
            Mark: {
                Starred: value === 'starred',
                Read: value === 'read'
            }
        }),
        moveTo: (value) => ({ FileInto: value === '' ? [] : [value] }),
        labels: (Labels) => ({ Labels }),
        autoReply: (Vacation) => ({ Vacation })
    };

    const handleChange = (mode) => {
        const formatData = ACTIONS[mode];
        return ({ target }) => onChange(formatData(target.value));
    };

    const getDefaultValue = (mode) => {
        if (mode === 'markAs') {
            if (Actions.Mark.Starred && !Actions.Mark.Read) {
                return 'starred';
            }

            if (!Actions.Mark.Starred && Actions.Mark.Read) {
                return 'read';
            }
        }

        if (mode === 'moveTo') {
            const key = Actions.FileInto.find((path) => !labelsMap[path]);
            if (key) {
                return key;
            }
        }
    };

    const getSelectedLabels = () => {
        const { Labels = [], FileInto } = Actions;
        const toLabel = (path) => labelsMap[path];
        const list = FileInto.filter(toLabel);
        return [...new Set(Labels.concat(list))].map(toLabel);
    };

    const handleOnChangeLabel = (labels) => {
        onChange(ACTIONS.labels(labels));
    };

    const handleOnChangeAutoReply = (autoReply) => {
        onChange(ACTIONS.autoReply(autoReply));
    };

    return (
        <>
            <div className="flex flex-nowrap onmobile-flex-column">
                <Label htmlFor="actions">{c('New Label form').t`Actions`}</Label>
                <Field>
                    <div className="mb1">
                        {loadingLabels ? (
                            <Loader />
                        ) : (
                            <LabelActions
                                onChange={handleOnChangeLabel}
                                labels={labels}
                                selection={getSelectedLabels()}
                            />
                        )}
                    </div>
                    <div className="mb1">
                        {loadingFolders ? (
                            <Loader />
                        ) : (
                            <Select
                                options={MOVE_TO}
                                onChange={handleChange('moveTo')}
                                className="mlauto"
                                defaultValue={getDefaultValue('moveTo')}
                            />
                        )}
                    </div>
                    <div className="mb1">
                        <Select
                            options={MARK_AS}
                            onChange={handleChange('markAs')}
                            className="mlauto"
                            defaultValue={getDefaultValue('markAs')}
                        />
                    </div>
                </Field>
            </div>
            <AutoReplyAction onChange={handleOnChangeAutoReply} defaultValue={Actions.Vacation} />
            {errors.isValid === false ? (
                <Row>
                    <Label>{/* Dummy label to hold space */ ' '}</Label>
                    <ErrorZone id="ActionsError">{c('Error').t`A filter must have an action`}</ErrorZone>
                </Row>
            ) : null}
        </>
    );
}

ActionsEditor.propTypes = {
    filter: PropTypes.object.isRequired,
    errors: PropTypes.object,
    onChange: PropTypes.func
};

export default ActionsEditor;

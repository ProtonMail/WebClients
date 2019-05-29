import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Loader, Label, Select, Row, Field, useFormattedLabels, ErrorZone } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

import LabelActions from './LabelActions';

function ActionsEditor({ filter, onChange, errors }) {
    const { Actions } = filter.Simple;
    const [labelModel = [], loading] = useFormattedLabels();

    const labels = labelModel.getLabels();
    const folders = labelModel.getFolders().map(({ Name }) => ({
        text: c('Filter Actions').t`Move to ${Name}`,
        value: Name
    }));

    const MOVE_TO = [
        {
            text: c('Filter Actions').t`Move to ...`
        },
        {
            text: c('Filter Actions').t`Move to archive`,
            value: 'archive'
        },
        {
            text: c('Filter Actions').t`Move to mailbox`,
            value: 'inbox'
        }
    ].concat(folders);

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
        moveTo: (value) => ({ FileInto: [value] }),
        labels: (Labels) => ({ Labels })
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
            const MAP = labelModel.getLabelsMap();
            const key = Actions.FileInto.find((name) => !MAP[name]);
            if (key) {
                return key;
            }
        }
    };

    const getSelectedLabels = () => {
        const MAP = labelModel.getLabelsMap();
        const { Labels = [], FileInto } = Actions;
        const toLabel = (name) => MAP[name];
        const list = FileInto.filter(toLabel);
        return [...new Set(Labels.concat(list))].map(toLabel);
    };

    const handleOnChangeLabel = (labels) => {
        onChange(ACTIONS.labels(labels));
    };

    return (
        <Row>
            <Label htmlFor="actions">{c('New Label form').t`Actions`}</Label>
            <Field className="w100">
                <div>
                    {loading ? (
                        <Loader />
                    ) : (
                        <LabelActions onChange={handleOnChangeLabel} labels={labels} selection={getSelectedLabels()} />
                    )}
                </div>
                <Row>
                    {loading ? (
                        <Loader />
                    ) : (
                        <Select
                            options={MOVE_TO}
                            onChange={handleChange('moveTo')}
                            className="mlauto"
                            defaultValue={getDefaultValue('moveTo')}
                        />
                    )}
                </Row>
                <Row>
                    <Select
                        options={MARK_AS}
                        onChange={handleChange('markAs')}
                        className="mlauto"
                        defaultValue={getDefaultValue('markAs')}
                    />
                </Row>

                {errors.isValid === false ? (
                    <ErrorZone id="ActionsError">{c('Error').t`A filter must have an action`}</ErrorZone>
                ) : null}
            </Field>
        </Row>
    );
}

ActionsEditor.propTypes = {
    filter: PropTypes.object.isRequired,
    errors: PropTypes.object,
    onChange: PropTypes.func
};

ActionsEditor.defaultProps = {
    errors: {},
    onChange: noop
};

export default ActionsEditor;

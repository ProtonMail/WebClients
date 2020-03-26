import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Alert, Row, Label, useLabels } from 'react-components';
import { toMap } from 'proton-shared/lib/helpers/object';

import PreviewActionValue from './PreviewActionValue';
import './Preview.css';
import { classnames } from '../../../helpers/component';

const formatActions = (actions, labelsMap) => {
    const getMarkLabel = ({ Starred, Read }) => {
        if (Starred) {
            return c('Filter preview').t`starred`;
        }

        if (Read) {
            return c('Filter preview').t`read`;
        }
    };

    const MAP_FOLDER_ICON = {
        inbox: 'inbox',
        archive: 'archive'
    };

    const getFolderIcon = (folder) => MAP_FOLDER_ICON[folder] || 'folder';

    return Object.keys(actions).reduce((acc, key) => {
        if (key === 'Mark') {
            const value = getMarkLabel(actions[key]);
            value &&
                acc.push({
                    label: c('Filter preview').t`Mark email as`,
                    icon: value === 'starred' ? 'star' : 'read',
                    value
                });
        }

        if (key === 'FileInto') {
            const { folder, labels } = actions[key].concat(actions.Labels || []).reduce(
                (acc, name) => {
                    labelsMap[name] && acc.labels.push(labelsMap[name]);
                    !labelsMap[name] && (acc.folder = name);
                    return acc;
                },
                { folder: '', labels: [] }
            );

            folder &&
                acc.push({
                    label: c('Filter preview').t`Move email to`,
                    icon: getFolderIcon(folder),
                    value: folder
                });

            labels.length &&
                acc.push({
                    label: c('Filter preview').t`Label email as`,
                    icon: 'label',
                    value: labels
                });
        }

        return acc;
    }, []);
};

function PreviewFilter({ filter }) {
    const [labels] = useLabels();
    const labelsMap = toMap(labels, 'Path');

    const operatorMap = {
        then: c('Filter Preview').t`then`,
        all: c('Filter Preview').t`and`,
        any: c('Filter Preview').t`or`,
        if: c('Filter Preview').t`if`
    };

    const { Conditions = [], Operator = {}, Actions = {} } = filter.Simple;

    return (
        <>
            <Alert>{c('Filter preview')
                .t`Custom filter work on all new emails, including incoming emails as well as sent emails.`}</Alert>

            <div className="Preview-row">
                <b className="mb1">{c('Filter preview').t`Conditions`}:</b>
                {Conditions.map(({ Comparator, Type, Values }, i) => {
                    const className = classnames(['Preview-condition', !i && 'mt1']);

                    return (
                        <Row className={className} key={i.toString()}>
                            {!i ? (
                                <Label className="Preview-label pt0 uppercase">{operatorMap.if}</Label>
                            ) : (
                                <Label className="Preview-label pt0 uppercase">{operatorMap[Operator.value]}</Label>
                            )}
                            <div>
                                <b>
                                    {Type.label} {Comparator.label}
                                </b>
                                :{' '}
                                {Values.filter((val) => val !== null).map((val, i) => {
                                    return (
                                        <span
                                            className="Preview-condition-value relative bg-global-highlight"
                                            data-operator={operatorMap.any}
                                            key={i.toString()}
                                        >
                                            {val}
                                        </span>
                                    );
                                })}
                            </div>
                        </Row>
                    );
                })}
            </div>

            <div className="Preview-row">
                <b>{c('Filter preview').t`Actions`}:</b>

                {formatActions(Actions, labelsMap).map(({ label, value, icon }, i) => {
                    const className = classnames(['Preview-condition', !i && 'mt1']);
                    return (
                        <Row className={className} key={i.toString()}>
                            {!i ? (
                                <Label className="Preview-label pt0 uppercase">{operatorMap.then}</Label>
                            ) : (
                                <Label className="Preview-label pt0 uppercase">{operatorMap.all}</Label>
                            )}
                            <div>
                                <b>{label}</b>: <PreviewActionValue value={value} icon={icon} />
                            </div>
                        </Row>
                    );
                })}
            </div>
        </>
    );
}

PreviewFilter.propTypes = {
    filter: PropTypes.object.isRequired
};

export default PreviewFilter;

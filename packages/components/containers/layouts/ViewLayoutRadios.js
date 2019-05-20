import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { RadioCards } from 'react-components';
import { VIEW_LAYOUT } from 'proton-shared/lib/constants';
import inboxColumnSvg from 'design-system/assets/img/pm-images/inbox-column.svg';
import inboxRowSvg from 'design-system/assets/img/pm-images/inbox-row.svg';

const { COLUMN, ROW } = VIEW_LAYOUT;

const ViewLayoutRadios = ({ viewLayout, onChange, loading, id, ...rest }) => {
    const radioCardColumn = {
        value: COLUMN,
        checked: viewLayout === COLUMN,
        id: 'columnRadio',
        disabled: loading,
        name: 'viewLayout',
        label: c('Label to change view layout').t`Column`,
        onChange() {
            onChange(COLUMN);
        },
        children: <img alt="Column" src={inboxColumnSvg} />
    };
    const radioCardRow = {
        value: ROW,
        checked: viewLayout === ROW,
        id: 'rowRadio',
        disabled: loading,
        name: 'viewLayout',
        label: c('Label to change view layout').t`Row`,
        onChange() {
            onChange(ROW);
        },
        children: <img alt="Row" src={inboxRowSvg} />
    };

    return <RadioCards list={[radioCardColumn, radioCardRow]} id={id} {...rest} />;
};

ViewLayoutRadios.propTypes = {
    viewLayout: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    id: PropTypes.string
};

export default ViewLayoutRadios;

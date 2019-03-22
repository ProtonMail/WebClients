import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { RadioCards } from 'react-components';
import { VIEW_LAYOUT } from 'proton-shared/lib/constants';
import inboxColumnSvg from 'design-system/assets/img/pm-images/inbox-colum.svg';
import inboxRowSvg from 'design-system/assets/img/pm-images/inbox-row.svg';

const { COLUMN, ROW } = VIEW_LAYOUT;

const ViewLayoutRadios = ({ viewLayout, handleChange, loading }) => {
    const radioCardColumn = {
        value: COLUMN,
        checked: viewLayout === COLUMN,
        id: 'columnRadio',
        disabled: loading,
        name: 'viewLayout',
        label: c('Label to change view layout').t`Column`,
        onChange: handleChange(COLUMN),
        children: <img alt="Column" src={inboxColumnSvg} />
    };
    const radioCardRow = {
        value: ROW,
        checked: viewLayout === ROW,
        id: 'rowRadio',
        disabled: loading,
        name: 'viewLayout',
        label: c('Label to change view layout').t`Row`,
        onChange: handleChange(ROW),
        children: <img alt="Row" src={inboxRowSvg} />
    };

    return <RadioCards list={[radioCardColumn, radioCardRow]} />;
};

ViewLayoutRadios.propTypes = {
    viewLayout: PropTypes.number.isRequired,
    handleChange: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

export default ViewLayoutRadios;

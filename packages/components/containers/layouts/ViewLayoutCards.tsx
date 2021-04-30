import React from 'react';
import { c } from 'ttag';

import { VIEW_LAYOUT } from 'proton-shared/lib/constants';

import inboxColumnSvg from 'design-system/assets/img/pm-images/inbox-column.svg';
import inboxRowSvg from 'design-system/assets/img/pm-images/inbox-row.svg';

import { LayoutCards } from '../../components';

const { COLUMN, ROW } = VIEW_LAYOUT;

interface Props {
    viewLayout: VIEW_LAYOUT;
    onChange: (viewLayout: VIEW_LAYOUT) => void;
    loading: boolean;
    describedByID: string;
}

const ViewLayoutCards = ({ viewLayout, onChange, loading, describedByID, ...rest }: Props) => {
    const layoutCardColumn = {
        value: COLUMN,
        selected: viewLayout === COLUMN,
        disabled: loading,
        name: 'viewLayout',
        label: c('Label to change view layout').t`Column`,
        onChange() {
            onChange(COLUMN);
        },
        src: inboxColumnSvg,
        describedByID,
    };
    const layoutCardRow = {
        value: ROW,
        selected: viewLayout === ROW,
        disabled: loading,
        name: 'viewLayout',
        label: c('Label to change view layout').t`Row`,
        onChange() {
            onChange(ROW);
        },
        src: inboxRowSvg,
        describedByID,
    };

    return <LayoutCards list={[layoutCardColumn, layoutCardRow]} describedByID={describedByID} {...rest} />;
};

export default ViewLayoutCards;

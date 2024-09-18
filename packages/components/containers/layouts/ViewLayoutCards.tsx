import { c } from 'ttag';

import LayoutCards from '@proton/components/components/input/LayoutCards';
import { VIEW_LAYOUT } from '@proton/shared/lib/mail/mailSettings';
import inboxColumnSvg from '@proton/styles/assets/img/layout/layout-thumb-inbox-column.svg';
import inboxRowSvg from '@proton/styles/assets/img/layout/layout-thumb-inbox-row.svg';

const { COLUMN, ROW } = VIEW_LAYOUT;

interface Props {
    viewLayout: VIEW_LAYOUT;
    onChange: (viewLayout: VIEW_LAYOUT) => void;
    loading: boolean;
    describedByID: string;
    className?: string;
    liClassName?: string;
}

const ViewLayoutCards = ({ viewLayout, onChange, loading, className, liClassName, describedByID, ...rest }: Props) => {
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

    return (
        <LayoutCards
            list={[layoutCardColumn, layoutCardRow]}
            className={className}
            liClassName={liClassName}
            describedByID={describedByID}
            {...rest}
        />
    );
};

export default ViewLayoutCards;

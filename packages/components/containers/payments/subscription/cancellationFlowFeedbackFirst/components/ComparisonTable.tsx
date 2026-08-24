/* eslint-disable jsx-a11y/prefer-tag-over-role */
import type { ReactNode } from 'react';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import clsx from '@proton/utils/clsx';

import Table from '../../../../../components/table/Table';
import TableBody from '../../../../../components/table/TableBody';
import TableCell from '../../../../../components/table/TableCell';
import TableRow from '../../../../../components/table/TableRow';
import useActiveBreakpoint from '../../../../../hooks/useActiveBreakpoint';

const CURRENT_PLAN_COLUMN_BG = 'bg-weak';
const TABLE_CLASS = 'simple-table--border-weak simple-table--border-lines-rounded shadow-norm rounded-xl mb-0';

interface ComparisonTableProps {
    leftHeader: ReactNode;
    rightHeader: ReactNode;
    features: ComparisonFeatureRow[];
}

interface InnerTableProps {
    leftHeader: ReactNode;
    rightHeader: ReactNode;
    features: ComparisonFeatureRow[];
    headerClassName: string;
}

interface StackRowProps {
    icon?: ReactNode;
    label: string;
    value: string | ReactNode;
    tooltip?: string;
}

export interface ComparisonFeatureRow {
    icon?: ReactNode;
    label: string;
    leftValue: string | ReactNode;
    rightValue: string | ReactNode;
    tooltip?: string;
}

interface FeatureLabelProps {
    label: string;
    tooltip?: string;
}

const FeatureLabel = ({ label, tooltip }: FeatureLabelProps) => {
    return (
        <span>
            {label}
            {tooltip && (
                <Tooltip openDelay={200} title={tooltip}>
                    <span className="inline-flex shrink-0 items-center justify-center align-text-bottom ml-1">
                        <IcInfoCircle className="color-primary shrink-0" />
                    </span>
                </Tooltip>
            )}
        </span>
    );
};

const StackRow = ({ icon, label, value, tooltip }: StackRowProps) => {
    return (
        <TableRow>
            <TableCell>
                <div className="flex flex-row flex-nowrap gap-2">
                    {icon && <span className="flex shrink-0 items-start pt-0.5">{icon}</span>}
                    <div className="flex-1 flex flex-nowrap items-center justify-space-between gap-1">
                        <div className="flex-1">
                            <FeatureLabel label={label} tooltip={tooltip} />
                        </div>
                        <span className="shrink-0">{value}</span>
                    </div>
                </div>
            </TableCell>
        </TableRow>
    );
};

const StackedTables = ({ leftHeader, rightHeader, features, headerClassName }: InnerTableProps) => {
    return (
        <div className="flex flex-column gap-4">
            <Table className={TABLE_CLASS}>
                <TableBody>
                    <TableRow>
                        <TableCell
                            role="columnheader"
                            className={`${headerClassName} ${CURRENT_PLAN_COLUMN_BG} py-0 my-0`}
                        >
                            {leftHeader}
                        </TableCell>
                    </TableRow>
                    {features.map(({ icon, label, leftValue, tooltip }) => {
                        return <StackRow key={label} icon={icon} label={label} value={leftValue} tooltip={tooltip} />;
                    })}
                </TableBody>
            </Table>
            <Table className={TABLE_CLASS}>
                <TableBody>
                    <TableRow>
                        <TableCell
                            role="columnheader"
                            className={`${headerClassName} ${CURRENT_PLAN_COLUMN_BG} py-0 my-0`}
                        >
                            {rightHeader}
                        </TableCell>
                    </TableRow>
                    {features.map(({ icon, label, rightValue }) => {
                        return <StackRow key={label} icon={icon} label={label} value={rightValue} />;
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

const SideBySideTable = ({ leftHeader, rightHeader, features, headerClassName }: InnerTableProps) => {
    return (
        <Table className={TABLE_CLASS}>
            <TableBody>
                <TableRow>
                    <TableCell className="w-2/5">{''}</TableCell>
                    <TableCell role="columnheader" className={CURRENT_PLAN_COLUMN_BG}>
                        <span className={headerClassName}>{leftHeader}</span>
                    </TableCell>
                    <TableCell role="columnheader">
                        <span className={headerClassName}>{rightHeader}</span>
                    </TableCell>
                </TableRow>
                {features.map(({ icon, label, leftValue, rightValue, tooltip }) => {
                    return (
                        <TableRow key={label}>
                            <TableCell className="w-2/5">
                                <div className="flex flex-nowrap flex-row items-start gap-2">
                                    <span className="shrink-0 flex mt-0.5">{icon}</span>
                                    <div className="flex-1">
                                        <FeatureLabel label={label} tooltip={tooltip} />
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className={`text-center ${CURRENT_PLAN_COLUMN_BG}`}>{leftValue}</TableCell>
                            <TableCell className="text-center">{rightValue}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};

export const ComparisonTable = (props: ComparisonTableProps) => {
    const { viewportWidth } = useActiveBreakpoint();
    const isMediumOrSmaller = viewportWidth['<=small'];
    const headerClassName = clsx('flex items-center gap-2', !isMediumOrSmaller && 'justify-center');

    if (isMediumOrSmaller) {
        return <StackedTables {...props} headerClassName={headerClassName} />;
    }

    return <SideBySideTable {...props} headerClassName={headerClassName} />;
};

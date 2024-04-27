import type { FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Card } from '@proton/atoms/Card';
import { Table, TableBody, TableHeader, TableHeaderCell, TableRow } from '@proton/components/components/table';
import { TableRowLoading } from '@proton/pass/components/Layout/Table/TableRowLoading';
import type { MonitorTableRow } from '@proton/pass/hooks/monitor/useBreachesTable';

import { BreachGroupRow } from './BreachGroupRow';

type Props = {
    actions?: ReactNode;
    className?: string;
    data: MonitorTableRow[];
    displayLimit?: number;
    title?: string;
    loading: boolean;
    seeAllHref?: string;
};

export const BreachGroupList: FC<Props> = ({ actions, className, data, displayLimit, title, loading, seeAllHref }) => (
    <section className={className}>
        {title && (
            <header className="mb-2 flex justify-space-between">
                <div className="flex gap-2 items-center">
                    <span className="text-bold">{title}</span>
                    {actions}
                </div>
                {displayLimit && data.length > displayLimit && seeAllHref && <Link to={seeAllHref}>See all</Link>}
            </header>
        )}
        <Card rounded>
            <Table hasActions responsive="stacked">
                <TableHeader>
                    <TableRow>
                        <TableHeaderCell>{c('Label').t`Email`}</TableHeaderCell>
                        <TableHeaderCell>{c('Label').t`Status`}</TableHeaderCell>
                        <TableHeaderCell>{c('Label').t`Used in`}</TableHeaderCell>
                        <TableHeaderCell className="w-custom" style={{ '--w-custom': '4rem' }} />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRowLoading rows={3} cells={4} />
                    ) : (
                        data
                            .slice(0, displayLimit)
                            .map((address) => <BreachGroupRow key={address.email} {...address} />)
                    )}
                </TableBody>
            </Table>
        </Card>
    </section>
);

import { type FC, type ReactNode, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Card } from '@proton/atoms';
import { Table, TableBody, TableHeader, TableHeaderCell, TableRow } from '@proton/components';
import { TableRowLoading } from '@proton/pass/components/Layout/Table/TableRowLoading';
import type { MonitorTableRow } from '@proton/pass/hooks/monitor/useBreachesTable';

import { BreachGroupRow } from './BreachGroupRow';

type Props = {
    actions?: ReactNode;
    data: MonitorTableRow[];
    displayLimit?: number;
    loading: boolean;
    seeAllHref?: string;
    title?: string;
};

export const BreachGroupList: FC<Props> = ({ actions, data, displayLimit, title, loading, seeAllHref }) => {
    const rows = useMemo(() => data.slice(0, displayLimit), [data, displayLimit]);
    const empty = !loading && data.length === 0;
    const seeAll = !loading && !empty && displayLimit && seeAllHref;

    return (
        <section className="w-full">
            {title && (
                <header className="mb-2 flex justify-space-between items-center">
                    <div className="flex gap-2 items-center">
                        <span className="text-bold">{title}</span>
                        {actions}
                    </div>
                    {seeAll && <Link to={seeAllHref}>{c('Action').t`See all`}</Link>}
                </header>
            )}
            <Card rounded>
                {empty ? (
                    <div className="color-weak">{c('Label').t`None`}</div>
                ) : (
                    <Table hasActions className="mb-2">
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell>{c('Label').t`Email`}</TableHeaderCell>
                                <TableHeaderCell>{c('Label').t`Status`}</TableHeaderCell>
                                <TableHeaderCell>{c('Label').t`Used in`}</TableHeaderCell>
                                <TableHeaderCell className="w-custom" style={{ '--w-custom': '4rem' }} />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(() => {
                                if (loading) return <TableRowLoading rows={3} cells={4} />;
                                return rows.map((address) => <BreachGroupRow key={address.email} {...address} />);
                            })()}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </section>
    );
};

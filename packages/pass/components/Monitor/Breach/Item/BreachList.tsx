import type { FC } from 'react';

import { c } from 'ttag';

import { Card } from '@proton/atoms/Card';
import { Table, TableBody, TableHeader, TableHeaderCell, TableRow } from '@proton/components/components/table';
import type { FetchedBreaches } from '@proton/components/containers';
import { TableRowLoading } from '@proton/pass/components/Layout/Table/TableRowLoading';

import { BreachListRow } from './BreachListRow';

type Props = {
    className?: string;
    data: FetchedBreaches[];
    loading: boolean;
    title: string;
};

export const BreachList: FC<Props> = ({ className, data, loading, title }) => {
    return (
        <section className={className}>
            <header className="mb-2 flex justify-space-between">
                <span className="text-bold">{title}</span>
            </header>
            <Card rounded>
                <Table hasActions responsive="stacked">
                    <TableHeader>
                        <TableRow>
                            <TableHeaderCell>{c('Label').t`Name`}</TableHeaderCell>
                            <TableHeaderCell>{c('Label').t`Date`}</TableHeaderCell>
                            <TableHeaderCell className="w-custom" style={{ '--w-custom': '4rem' }} />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRowLoading rows={3} cells={3} />
                        ) : (
                            data.map((breach) => <BreachListRow key={breach.id} breach={breach} />)
                        )}
                    </TableBody>
                </Table>
            </Card>
        </section>
    );
};

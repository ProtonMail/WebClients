import type { FC } from 'react';

import { c } from 'ttag';

import { Card } from '@proton/atoms/Card';
import type { FetchedBreaches } from '@proton/components';
import { Table, TableBody, TableHeader, TableHeaderCell, TableRow } from '@proton/components/components/table';
import { TableRowLoading } from '@proton/pass/components/Layout/Table/TableRowLoading';

import { BreachListRow } from './BreachListRow';

type Props = {
    data: FetchedBreaches[];
    loading: boolean;
    title: string;
};

export const BreachList: FC<Props> = ({ data, loading, title }) => {
    const empty = !loading && data.length === 0;

    return (
        <section className="w-full">
            <header className="mb-2 flex justify-space-between">
                <span className="text-bold">{title}</span>
            </header>
            <Card rounded>
                {empty ? (
                    <div className="color-weak">{c('Label').t`None`}</div>
                ) : (
                    <Table hasActions className="mb-2">
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell>{c('Label').t`Name`}</TableHeaderCell>
                                <TableHeaderCell>{c('Label').t`Date`}</TableHeaderCell>
                                <TableHeaderCell className="w-custom" style={{ '--w-custom': '4rem' }} />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(() => {
                                if (loading) return <TableRowLoading rows={3} cells={3} />;
                                return data.map((breach) => <BreachListRow key={breach.id} breach={breach} />);
                            })()}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </section>
    );
};

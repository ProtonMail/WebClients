import type { FC } from 'react';

import { c } from 'ttag';

import { Card } from '@proton/atoms/Card/Card';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import type { FetchedBreaches } from '@proton/components/containers/credentialLeak/models';
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
            <Card rounded className="border-weak">
                {empty ? (
                    <div className="color-weak">{c('Label').t`None`}</div>
                ) : (
                    <Table hasActions borderWeak className="mb-2">
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

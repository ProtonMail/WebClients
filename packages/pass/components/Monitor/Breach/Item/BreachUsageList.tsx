import type { FC } from 'react';

import { c } from 'ttag';

import { Card } from '@proton/atoms/Card/Card';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import type { LoginItem } from '@proton/pass/types';

import { BreachUsageRow } from './BreachUsageRow';

type Props = { data: LoginItem[] };

export const BreachUsageList: FC<Props> = ({ data }) => {
    const empty = data.length === 0;

    return (
        <section className="w-full">
            <header className="mb-2 flex justify-space-between">
                <span className="text-bold">{c('Label').t`Used in`}</span>
            </header>
            <Card rounded className="border-weak">
                {empty ? (
                    <div className="color-weak">{c('Label').t`None`}</div>
                ) : (
                    <Table hasActions borderWeak className="mb-2">
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell>{c('Label').t`Title`}</TableHeaderCell>
                                <TableHeaderCell>{c('Label').t`Last updated`}</TableHeaderCell>
                                <TableHeaderCell className="w-custom" style={{ '--w-custom': '4rem' }} />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item) => (
                                <BreachUsageRow key={item.itemId} item={item} />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </section>
    );
};

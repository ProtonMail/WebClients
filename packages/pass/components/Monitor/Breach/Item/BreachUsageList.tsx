import type { FC } from 'react';

import { c } from 'ttag';

import { Card } from '@proton/atoms';
import { Table, TableBody, TableHeader, TableHeaderCell, TableRow } from '@proton/components';
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
            <Card rounded>
                {empty ? (
                    <div className="color-weak">{c('Label').t`None`}</div>
                ) : (
                    <Table hasActions className="mb-2">
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

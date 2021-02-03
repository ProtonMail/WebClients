import { c } from 'ttag';
import React from 'react';
import { LoaderIcon, Table, TableRow, TableHeader, TableBody, Badge } from '../../../components';
import { ImportKey, Status } from './interface';

interface Props {
    keys: ImportKey[];
}

const ImportKeysList = ({ keys }: Props) => {
    const list = keys.map(({ status, fingerprint, result }, i) => {
        const keyStatus = (() => {
            if (status === Status.ERROR) {
                return (
                    <Badge type="error" tooltip={result === 'ok' ? '' : result?.message}>{c('Title').t`Error`}</Badge>
                );
            }
            if (status === Status.SUCCESS) {
                return <Badge type="success">{c('Title').t`Success`}</Badge>;
            }
            return <LoaderIcon />;
        })();

        return (
            <TableRow
                key={i}
                cells={[
                    <span key={0} className="max-w100 inline-block text-ellipsis">
                        {fingerprint}
                    </span>,
                    keyStatus,
                ]}
            />
        );
    });
    return (
        <Table>
            <TableHeader
                cells={[c('Title header for keys table').t`Fingerprint`, c('Title header for keys table').t`Status`]}
            />
            <TableBody>{list}</TableBody>
        </Table>
    );
};

export default ImportKeysList;

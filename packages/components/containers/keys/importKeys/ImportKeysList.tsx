import { c } from 'ttag';

import Badge from '@proton/components/components/badge/Badge';
import LoaderIcon from '@proton/components/components/loader/LoaderIcon';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';

import type { ImportKey } from './interface';
import { Status } from './interface';

interface Props {
    keys: ImportKey[];
}

const ImportKeysList = ({ keys }: Props) => {
    const list = keys.map(({ status, fingerprint, result }, i) => {
        const keyStatus = (() => {
            if (status === Status.ERROR) {
                return (
                    <Badge type="error" tooltip={result === 'ok' ? '' : result?.message} tooltipOpenDelay={0}>
                        {c('Title').t`Error`}
                    </Badge>
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
                    <span key={0} className="max-w-full inline-block text-ellipsis">
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

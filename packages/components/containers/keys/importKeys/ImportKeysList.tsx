import { c } from 'ttag';

import Badge from '../../../components/badge/Badge';
import LoaderIcon from '../../../components/loader/LoaderIcon';
import Table from '../../../components/table/Table';
import TableBody from '../../../components/table/TableBody';
import TableHeader from '../../../components/table/TableHeader';
import TableRow from '../../../components/table/TableRow';
import type { ImportKeyState } from './interface';
import { Status } from './interface';

interface Props {
    keys: ImportKeyState[];
}

const ImportKeysList = ({ keys }: Props) => {
    const list = keys.map(({ importKeyData, status, fingerprint, result }) => {
        const keyStatus = (() => {
            if (status === Status.ERROR) {
                return (
                    <Badge type="error" tooltip={result === 'ok' ? '' : result} tooltipOpenDelay={0}>
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
                key={importKeyData.id}
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

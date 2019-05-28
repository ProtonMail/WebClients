import { c } from 'ttag';
import React from 'react';
import PropTypes from 'prop-types';
import { LoaderIcon, Table, TableRow, TableHeader, TableBody, Badge } from 'react-components';

export const STATUS = {
    SUCCESS: 1,
    LOADING: 2,
    ERROR: 3
};

const ImportKeysList = ({ keys }) => {
    const list = keys.map(({ status, fingerprint, result }, i) => {
        const keyStatus = (() => {
            if (status === STATUS.ERROR) {
                return <Badge type="error" tooltip={result.message}>{c('Title').t`Error`}</Badge>;
            }
            if (status === STATUS.SUCCESS) {
                return <Badge type="success">{c('Title').t`Success`}</Badge>;
            }
            return <LoaderIcon />;
        })();

        return (
            <TableRow
                key={i}
                cells={[
                    <span key={0} className="mw100 inbl ellipsis">
                        {fingerprint}
                    </span>,
                    keyStatus
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

ImportKeysList.propTypes = {
    keys: PropTypes.array.isRequired
};

export default ImportKeysList;

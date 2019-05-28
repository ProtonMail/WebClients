import React, { useRef } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Badge, Button, LoaderIcon, Table, TableRow, TableHeader, TableBody } from 'react-components';

import SelectKeyFiles from '../shared/SelectKeyFiles';

import KeysStatus from '../KeysStatus';

export const STATUS = {
    INACTIVE: 1,
    UPLOADED: 2,
    SUCCESS: 3,
    LOADING: 4,
    ERROR: 5
};

const getKeyStatusError = (error) => {
    return {
        tooltip: error.message,
        title: c('Key state badge').t`Error`,
        type: 'error'
    };
};

const getStatus = (status, result) => {
    if (status === STATUS.ERROR) {
        const { tooltip, type, title } = getKeyStatusError(result);
        return (
            <Badge type={type} tooltip={tooltip}>
                {title}
            </Badge>
        );
    }
    if (status === STATUS.INACTIVE || status === STATUS.UPLOADED) {
        return <KeysStatus isDecrypted={false} />;
    }
    if (status === STATUS.SUCCESS) {
        return <KeysStatus isDecrypted={true} />;
    }
};

const ReactivateKeysList = ({ loading, allKeys, onUpload }) => {
    const inactiveKeyRef = useRef();
    const selectRef = useRef();

    const isUpload = !!onUpload;

    const handleFiles = (files) => {
        onUpload(inactiveKeyRef.current, files);
        inactiveKeyRef.current = undefined;
    };

    const list = allKeys
        .map(({ User, Address, inactiveKeys }) => {
            const email = Address ? Address.Email : User.Name;

            return inactiveKeys.map((inactiveKey) => {
                const { Key, fingerprint, uploadedPrivateKey, status, result } = inactiveKey;

                const keyStatus = loading && !result ? <LoaderIcon /> : getStatus(status, result);

                const uploadColumn = uploadedPrivateKey ? (
                    <Badge type="success">{c('Action').t`Key uploaded`}</Badge>
                ) : (
                    <Button
                        onClick={() => {
                            inactiveKeyRef.current = inactiveKey;
                            selectRef.current.click();
                        }}
                    >
                        {c('Action').t`Upload`}
                    </Button>
                );

                return (
                    <TableRow
                        key={Key.ID}
                        cells={[
                            <span key={0} className="mw100 inbl ellipsis">
                                {email}
                            </span>,
                            <code key={1} className="mw100 inbl ellipsis">
                                {fingerprint}
                            </code>,
                            keyStatus,
                            isUpload ? uploadColumn : null
                        ].filter(Boolean)}
                    />
                );
            });
        })
        .flat();

    return (
        <>
            {isUpload ? (
                <SelectKeyFiles ref={selectRef} multiple={false} onFiles={handleFiles} autoClick={false} />
            ) : null}
            <Table>
                <TableHeader
                    cells={[
                        c('Title header for keys table').t`Email`,
                        c('Title header for keys table').t`Fingerprint`,
                        c('Title header for keys table').t`Status`,
                        isUpload ? c('Title header for keys table').t`Action` : null
                    ].filter(Boolean)}
                />
                <TableBody>{list}</TableBody>
            </Table>
        </>
    );
};

ReactivateKeysList.propTypes = {
    allKeys: PropTypes.array.isRequired,
    onUpload: PropTypes.func,
    loading: PropTypes.bool,
    onError: PropTypes.func
};

ReactivateKeysList.defaultProps = {
    loading: false
};

export default ReactivateKeysList;

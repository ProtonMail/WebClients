import React, { useRef } from 'react';
import { c } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';
import { Badge, Button, LoaderIcon, Table, TableRow, TableHeader, TableBody } from '../../../components';

import SelectKeyFiles from '../shared/SelectKeyFiles';

import KeysStatus from '../KeysStatus';
import { Status, KeyReactivationRequestStateData, KeyReactivationRequestState } from './interface';

const getStatus = (status: Status, result: any) => {
    if (status === Status.ERROR) {
        return (
            <Badge type="error" tooltip={result?.message}>
                {c('Key state badge').t`Error`}
            </Badge>
        );
    }
    if (status === Status.INACTIVE || status === Status.UPLOADED) {
        return <KeysStatus isDecrypted={false} />;
    }
    if (status === Status.SUCCESS) {
        return <KeysStatus isDecrypted />;
    }
};

interface Props {
    loading?: boolean;
    states: KeyReactivationRequestState[];
    onUpload?: (id: string, files: OpenPGPKey[]) => void;
}

const ReactivateKeysList = ({ loading = false, states, onUpload }: Props) => {
    const inactiveKeyRef = useRef<KeyReactivationRequestStateData>();
    const selectRef = useRef<HTMLInputElement>(null);

    const isUpload = !!onUpload;

    const handleFiles = (files: OpenPGPKey[]) => {
        if (!inactiveKeyRef.current || !onUpload) {
            return;
        }
        onUpload(inactiveKeyRef.current.id, files);
        inactiveKeyRef.current = undefined;
    };

    const list = states
        .map((state) => {
            const email = state.address?.Email || state.user?.Name || '';

            return state.keysToReactivate.map((keyState) => {
                const { Key, fingerprint, uploadedPrivateKey, status, result } = keyState;

                const keyStatus = loading && !result ? <LoaderIcon /> : getStatus(status, result);

                const uploadColumn = uploadedPrivateKey ? (
                    <Badge type="success">{c('Key status displayed in a badge').t`Key uploaded`}</Badge>
                ) : (
                    <Button
                        onClick={() => {
                            inactiveKeyRef.current = keyState;
                            selectRef.current?.click();
                        }}
                    >
                        {c('Action').t`Upload`}
                    </Button>
                );

                return (
                    <TableRow
                        key={Key.ID}
                        cells={[
                            <span key={0} className="max-w100 inline-block text-ellipsis">
                                {email}
                            </span>,
                            <code key={1} className="max-w100 inline-block text-ellipsis">
                                {fingerprint}
                            </code>,
                            keyStatus,
                            isUpload ? uploadColumn : null,
                        ].filter(Boolean)}
                    />
                );
            });
        })
        .flat();

    return (
        <>
            {isUpload ? (
                <SelectKeyFiles
                    ref={selectRef}
                    multiple={false}
                    onFiles={handleFiles}
                    className="hidden"
                    autoClick={false}
                />
            ) : null}
            <Table className="simple-table--has-actions">
                <TableHeader
                    cells={[
                        c('Title header for keys table').t`Email`,
                        c('Title header for keys table').t`Fingerprint`,
                        c('Title header for keys table').t`Status`,
                        isUpload ? c('Title header for keys table').t`Action` : null,
                    ].filter(Boolean)}
                />
                <TableBody>{list}</TableBody>
            </Table>
        </>
    );
};

export default ReactivateKeysList;

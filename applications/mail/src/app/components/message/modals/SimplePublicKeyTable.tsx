import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableRow, KeyWarningIcon, useActiveBreakpoint, useLoading, Loader } from 'react-components';
import { c } from 'ttag';
import { algorithmInfo } from 'pmcrypto';
import { getFormattedAlgorithmName } from 'proton-shared/lib/keys';
import { dateLocale } from 'proton-shared/lib/i18n';
import { isValid, format } from 'date-fns';

import { ContactWithBePinnedPublicKey } from 'proton-shared/lib/interfaces/contacts';

interface Props {
    contact: ContactWithBePinnedPublicKey;
}

const SimplePublicKeyTable = ({ contact }: Props) => {
    const [expirationDate, setExpirationDate] = useState<Date | undefined>();
    const [loading, withLoading] = useLoading();
    const { isNarrow, isTinyMobile } = useActiveBreakpoint();

    const publicKey = contact.bePinnedPublicKey;
    const fingerprint = publicKey.getFingerprint();
    const creationDate = new Date(publicKey.getCreationTime());
    const algorithmType = getFormattedAlgorithmName(publicKey.getAlgorithmInfo() as algorithmInfo);

    useEffect(() => {
        const getExpirationTime = async () => {
            const time = await publicKey.getExpirationTime('encrypt');
            setExpirationDate(new Date(time));
        };
        void withLoading(getExpirationTime());
    }, []);

    const fingerprintCell = (
        <div key={fingerprint} title={fingerprint} className="flex flex-nowrap">
            <KeyWarningIcon
                className="mr0-5 flex-item-noshrink"
                publicKey={publicKey}
                emailAddress={contact.emailAddress}
                isInternal={contact.isInternal}
            />
            <span className="flex-item-fluid text-ellipsis">{fingerprint}</span>
        </div>
    );
    const creationCell = isNarrow
        ? null
        : isValid(creationDate)
        ? format(creationDate, 'PP', { locale: dateLocale })
        : '-';
    const expirationCell = isTinyMobile ? null : loading ? (
        <Loader className="icon-18p mauto flex" />
    ) : isValid(expirationDate) ? (
        format(expirationDate as Date, 'PP', { locale: dateLocale })
    ) : (
        '-'
    );
    const algorithmCell = !isNarrow && algorithmType;
    const cells = [fingerprintCell, creationCell, expirationCell, algorithmCell];

    return (
        <Table className="simple-table">
            <thead>
                <tr>
                    <th scope="col" className="text-ellipsis">{c('Table header').t`Fingerprint`}</th>
                    {!isNarrow && <th scope="col" className="text-ellipsis">{c('Table header').t`Created`}</th>}
                    {!isTinyMobile && <th scope="col" className="text-ellipsis">{c('Table header').t`Expires`}</th>}
                    {!isNarrow && <th scope="col" className="text-ellipsis">{c('Table header').t`Type`}</th>}
                </tr>
            </thead>
            <TableBody>
                <TableRow key={fingerprint} cells={cells} />
            </TableBody>
        </Table>
    );
};

export default SimplePublicKeyTable;

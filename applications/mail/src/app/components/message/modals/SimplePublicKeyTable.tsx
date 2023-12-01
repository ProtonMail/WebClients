import { useEffect, useState } from 'react';

import { format, isValid } from 'date-fns';
import { c } from 'ttag';

import {
    ContactKeyWarningIcon,
    Loader,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeaderCell,
    TableRow,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import { dateLocale } from '@proton/shared/lib/i18n';
import { ContactWithBePinnedPublicKey } from '@proton/shared/lib/interfaces/contacts';
import { getFormattedAlgorithmName } from '@proton/shared/lib/keys';

interface Props {
    contact: ContactWithBePinnedPublicKey;
}

const SimplePublicKeyTable = ({ contact }: Props) => {
    const [expirationDate, setExpirationDate] = useState<Date | typeof Infinity | null>();
    const [loading, withLoading] = useLoading();

    const publicKey = contact.bePinnedPublicKey;
    const fingerprint = publicKey.getFingerprint();
    const creationDate = new Date(publicKey.getCreationTime());
    const algorithmType = getFormattedAlgorithmName(publicKey.getAlgorithmInfo());

    useEffect(() => {
        const getExpirationTime = async () => {
            const time = await publicKey.getExpirationTime();
            setExpirationDate(time);
        };
        void withLoading(getExpirationTime());
    }, []);

    const fingerprintCell = (
        <div key={fingerprint} title={fingerprint} className="flex flex-nowrap">
            <ContactKeyWarningIcon
                className="mr-2 flex-item-noshrink"
                publicKey={publicKey}
                emailAddress={contact.emailAddress}
                isInternal={contact.isInternal}
            />
            <span className="flex-item-fluid text-ellipsis">{fingerprint}</span>
        </div>
    );
    const creationCell = isValid(creationDate) ? format(creationDate, 'PP', { locale: dateLocale }) : '-';
    const expirationCell = loading ? (
        <Loader className="icon-18p m-auto flex" />
    ) : isValid(expirationDate) ? (
        format(expirationDate as Date, 'PP', { locale: dateLocale })
    ) : (
        '-'
    );

    return (
        <Table responsive="cards">
            <TableHeader>
                <TableHeaderCell>{c('Table header').t`Fingerprint`}</TableHeaderCell>
                <TableHeaderCell className="w-1/5">{c('Table header').t`Created`}</TableHeaderCell>
                <TableHeaderCell className="w-1/6">{c('Table header').t`Expires`}</TableHeaderCell>
                <TableHeaderCell className="w-1/6">{c('Table header').t`Type`}</TableHeaderCell>
            </TableHeader>
            <TableBody>
                <TableRow key={fingerprint}>
                    <TableCell label={c('Table header').t`Fingerprint`}>{fingerprintCell}</TableCell>
                    <TableCell label={c('Table header').t`Created`}>{creationCell}</TableCell>
                    <TableCell label={c('Table header').t`Expires`}>{expirationCell}</TableCell>
                    <TableCell label={c('Table header').t`Type`}>{algorithmType}</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
};

export default SimplePublicKeyTable;

import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import {
    classnames,
    Alert,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    Copy,
    Badge,
    Button,
    Time,
    useModals,
    useNotifications
} from 'react-components';
import { DKIM_RSA_1024, DKIM_RSA_2048, DKIM_KEY_STATUS, DKIM_KEY_DNS_STATUS } from 'proton-shared/lib/constants';
import { orderBy } from 'proton-shared/lib/helpers/array';

import GenerateKeyModal from './GenerateKeyModal';

const ALGO = {
    [DKIM_RSA_1024]: 'RSA 1024',
    [DKIM_RSA_2048]: 'RSA 2048'
};

const getKeyStatusBadge = (status) =>
    ({
        [DKIM_KEY_STATUS.ACTIVE]: (
            <Badge
                className=""
                tooltip={c('Description').t`This is the key we currently use for signing your emails.`}
                type="success"
            >{c('Status').t`Active`}</Badge>
        ),
        [DKIM_KEY_STATUS.PENDING]: (
            <Badge
                className=""
                tooltip={c('Description').t`We are waiting for you to insert this record correctly in your DNS.`}
                type="warning"
            >{c('Status').t`Pending`}</Badge>
        ),
        [DKIM_KEY_STATUS.RETIRED]: (
            <Badge
                className=""
                tooltip={c('Description').t`This key is no longer used for DKIM signing.`}
                type="origin"
            >{c('Status').t`Retired`}</Badge>
        )
    }[status]);

const getDNSStatusBadge = (status) =>
    ({
        [DKIM_KEY_DNS_STATUS.INVALID]: (
            <Badge
                tooltip={c('Description').t`There is a problem with this record. Please check your DNS.`}
                type="error"
            >{c('Status').t`Warning`}</Badge>
        )
    }[status]);

const DKIMSection = ({ domain }) => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const openGenerateKeyModal = () => createModal(<GenerateKeyModal domain={domain} />);
    const handleCopy = () => createNotification({ text: c('Success').t`Key copied to clipboard!` });

    return (
        <>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/anti-spoofing/">
                {c('Info')
                    .t`ProtonMail supports DKIM signing for custom domains. To use DKIM authentication, please add the following TXT record into your DNS settings for this domain. This can typically be done in the control panel of your domain name registrar.`}
            </Alert>
            <p className="mb1 bl">{c('Label')
                .t`Please add the following TXT record. Note, DNS records can take several hours to update.`}</p>
            {orderBy(
                domain.Keys.filter(({ State }) => State !== DKIM_KEY_STATUS.DECEASED),
                'State'
            ).map(({ PublicKey, Algorithm, Selector, CreateTime, State, DNSState }, index) => {
                const value = `v=DKIM1;k=rsa;p=${State === DKIM_KEY_STATUS.RETIRED ? '' : `${PublicKey};`}`;
                return (
                    <React.Fragment key={index}>
                        <div
                            className={classnames([
                                'flex flex-spacebetween flex-items-center flex-nowrap',
                                DNSState === DKIM_KEY_DNS_STATUS.INVALID && 'mb1'
                            ])}
                        >
                            <div className="flex flex-nowrap flex-items-center">
                                <label className="bold mr0-5">{c('Label').t`Key:`}</label>
                                <span className="mr1">{ALGO[Algorithm]}</span>
                                {State === DKIM_KEY_STATUS.ACTIVE ? (
                                    <>
                                        <label className="bold mr0-5">{c('Label').t`Active since:`}</label>
                                        <Time>{CreateTime}</Time>
                                    </>
                                ) : null}
                            </div>
                            <div className="flex flex-nowrap">
                                {getDNSStatusBadge(DNSState)}
                                {getKeyStatusBadge(State)}
                            </div>
                        </div>
                        {DNSState === DKIM_KEY_DNS_STATUS.INVALID ? (
                            <Alert type="error">{c('Warning')
                                .t`Please check this DNS entry. It's not set properly. Most common problems include wrong format, having multiple entries with the same selector or having a wrong public key.`}</Alert>
                        ) : null}
                        <Table>
                            <TableHeader
                                cells={[
                                    c('Header for domain modal').t`Type`,
                                    c('Header for domain modal').t`Host name`,
                                    c('Header for domain modal').t`Value`
                                ]}
                            />
                            <TableBody>
                                <TableRow
                                    cells={[
                                        <code key="txt">TXT</code>,
                                        <code key="domain-key">{`${Selector}._domainkey`}</code>,
                                        <div className="flex flex-nowrap flex-items-center" key="value">
                                            <Copy
                                                onCopy={handleCopy}
                                                className="flex-item-noshrink pm-button--small mr0-5"
                                                value={value}
                                            />{' '}
                                            <code className="ellipsis" title={value}>
                                                {value}
                                            </code>
                                        </div>
                                    ]}
                                />
                            </TableBody>
                        </Table>
                    </React.Fragment>
                );
            })}
            <Button className="mb1" onClick={openGenerateKeyModal}>{c('Action').t`Generate a new key`}</Button>
            <Alert type="warning">{c('Info')
                .t`Keep this record in your DNS for as long as you want to use DKIM.`}</Alert>
        </>
    );
};

DKIMSection.propTypes = {
    domain: PropTypes.object.isRequired
};

export default DKIMSection;

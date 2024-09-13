import type { Dispatch, SetStateAction } from 'react';
import { Fragment, useEffect, useState } from 'react';

import { format, isValid } from 'date-fns';
import { c } from 'ttag';

import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import ContactKeyWarningIcon from '@proton/components/components/icon/ContactKeyWarningIcon';
import type { PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { API_KEY_SOURCE } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { ContactPublicKeyModelWithApiKeySource } from '@proton/shared/lib/interfaces';
import { getFormattedAlgorithmNames } from '@proton/shared/lib/keys';
import { getVerifyingKeys } from '@proton/shared/lib/keys/publicKeys';
import clsx from '@proton/utils/clsx';
import move from '@proton/utils/move';
import uniqueBy from '@proton/utils/uniqueBy';

import { Badge, Table, TableBody, TableRow } from '../../../components';
import useActiveBreakpoint from '../../../hooks/useActiveBreakpoint';

interface Props {
    model: ContactPublicKeyModelWithApiKeySource;
    setModel: Dispatch<SetStateAction<ContactPublicKeyModelWithApiKeySource | undefined>>;
}

type LocalKeyModel = {
    publicKey: PublicKeyReference;
    armoredPublicKey: string;
    fingerprint: string;
    algo: string;
    creationTime: Date;
    expirationTime: any;
    isPrimary?: boolean;
    isWKD: boolean;
    isKOO: boolean;
    isExpired: boolean;
    isRevoked: boolean;
    isTrusted: boolean;
    isObsolete: boolean;
    isCompromised: boolean;
    supportsEncryption: boolean;
    isUploaded: boolean;
    canBePrimary?: boolean;
    canBeTrusted: boolean;
    canBeUntrusted: boolean;
};

const ContactKeysTable = ({ model, setModel }: Props) => {
    const [keys, setKeys] = useState<LocalKeyModel[]>([]);
    const { viewportWidth } = useActiveBreakpoint();

    const { emailAddress } = model;
    const totalApiKeys = model.publicKeys.apiKeys.length;

    // translator: Please translate as in the sentence "this key is the primary one"
    const primaryText = c('Key badge').t`Primary`;
    // translator: Please translate as in the sentence "this key is obsolete"
    const obsoleteText = c('Key badge').t`Obsolete`;
    // translator: Please translate as in the sentence "this key is compromised"
    const compromisedText = c('Key badge').t`Compromised`;
    // translator: WKD stands for Web Key Directory (https://wiki.gnupg.org/WKD). You might not need to translate it
    const wkdText = c('Key badge').t`WKD`;
    // translator: KOO stands for keys.openpgp.org. You might not need to translate it
    const kooText = c('Key badge').t`KOO`;
    // translator: Please translate as in the sentence "this key is trusted"
    const trustedText = c('Key badge').t`Trusted`;
    // translator: Please translate as in the sentence "this key is revoked"
    const revokedText = c('Key badge').t`Revoked`;
    // translator: Please translate as in the sentence "this key is expired"
    const expiredText = c('Key badge').t`Expired`;

    /**
     * Extract keys info from model.publicKeys to define table body
     */
    const parse = async () => {
        const allKeys = model.isPGPInternal
            ? [...model.publicKeys.apiKeys]
            : [...model.publicKeys.apiKeys, ...model.publicKeys.pinnedKeys];
        const uniqueKeys = uniqueBy(allKeys, (publicKey) => publicKey.getFingerprint());
        const parsedKeys = await Promise.all(
            uniqueKeys.map(async (publicKey, index) => {
                const armoredPublicKey = await CryptoProxy.exportPublicKey({
                    key: publicKey,
                    format: 'armored',
                });
                const fingerprint = publicKey.getFingerprint();
                const creationTime = publicKey.getCreationTime();
                const expirationTime = await publicKey.getExpirationTime();
                const algoInfos = [
                    publicKey.getAlgorithmInfo(),
                    ...publicKey.subkeys.map((subkey) => subkey.getAlgorithmInfo()),
                ];
                const algo = getFormattedAlgorithmNames(algoInfos);
                const isExpired = await CryptoProxy.isExpiredKey({ key: publicKey });
                const isRevoked = await CryptoProxy.isRevokedKey({ key: publicKey });
                const isTrusted = model.trustedFingerprints.has(fingerprint);
                const supportsEncryption = model.encryptionCapableFingerprints.has(fingerprint);
                const isObsolete = model.obsoleteFingerprints.has(fingerprint);
                const isCompromised = model.compromisedFingerprints.has(fingerprint);
                const isPrimary = model.encrypt && index === 0 && supportsEncryption && !isObsolete && !isCompromised;
                const isWKD = !!model.apiKeysSourceMap[API_KEY_SOURCE.WKD]?.has(fingerprint);
                const isKOO = !!model.apiKeysSourceMap[API_KEY_SOURCE.KOO]?.has(fingerprint);
                const isUploaded = index >= totalApiKeys;
                const canBePrimary =
                    // the option is only relevant if no API keys are present:
                    // if the key was manually uploaded in the past, but now API keys are also present, the uploaded key can no longer be used for sending
                    // (the user will be prompted to trust one of the API keys when sending)
                    model.isPGPExternalWithoutExternallyFetchedKeys &&
                    !isPrimary &&
                    isUploaded &&
                    model.encrypt &&
                    supportsEncryption;
                const canBeTrusted = !isTrusted && !isUploaded && !isCompromised;
                const canBeUntrusted = isTrusted && !isUploaded;
                return {
                    publicKey,
                    armoredPublicKey,
                    fingerprint,
                    algo,
                    creationTime,
                    expirationTime,
                    isPrimary,
                    isWKD,
                    isKOO,
                    isExpired,
                    isRevoked,
                    isTrusted,
                    supportsEncryption,
                    isObsolete,
                    isCompromised,
                    isUploaded,
                    canBePrimary,
                    canBeTrusted,
                    canBeUntrusted,
                };
            })
        );
        setKeys(parsedKeys);
    };

    useEffect(() => {
        void parse();
    }, [model.publicKeys, model.trustedFingerprints, model.encrypt]);

    return (
        <Table hasActions>
            <thead>
                <tr>
                    <th scope="col" className="text-ellipsis" title={c('Table header').t`Fingerprint`}>{c(
                        'Table header'
                    ).t`Fingerprint`}</th>
                    {!viewportWidth['<=small'] && (
                        <th scope="col" className="text-ellipsis" title={c('Table header').t`Created`}>{c(
                            'Table header'
                        ).t`Created`}</th>
                    )}
                    {!viewportWidth.xsmall && (
                        <th scope="col" className="w-1/10 text-ellipsis" title={c('Table header').t`Expires`}>{c(
                            'Table header'
                        ).t`Expires`}</th>
                    )}
                    {!viewportWidth['<=small'] && (
                        <th scope="col" className="text-ellipsis" title={c('Table header').t`Type`}>{c('Table header')
                            .t`Type`}</th>
                    )}
                    <th scope="col" className="text-ellipsis w-1/6" title={c('Table header').t`Status`}>{c(
                        'Table header'
                    ).t`Status`}</th>
                    <th
                        scope="col"
                        className={clsx(['text-ellipsis', viewportWidth['<=small'] && 'w-2/5'])}
                        title={c('Table header').t`Actions`}
                    >{c('Table header').t`Actions`}</th>
                </tr>
            </thead>
            <TableBody data-testid="contact-keys-table">
                {keys.map(
                    ({
                        fingerprint,
                        algo,
                        creationTime,
                        expirationTime,
                        isPrimary,
                        isWKD,
                        isKOO,
                        publicKey,
                        armoredPublicKey,
                        isExpired,
                        isRevoked,
                        isTrusted,
                        supportsEncryption,
                        isObsolete,
                        isCompromised,
                        isUploaded,
                        canBePrimary,
                        canBeTrusted,
                        canBeUntrusted,
                    }) => {
                        const creation = new Date(creationTime);
                        const expiration = new Date(expirationTime);
                        const primaryKeyTooltipText = c('PGP Key info')
                            .t`This key is used to encrypt messages to this contact`;
                        const untrustKeyText = c('PGP Key info').t`We recommend that you "untrust" this key.`;
                        const obsoleteTooltipText = c('PGP Key info')
                            .t`${emailAddress} has marked this key as obsolete. This key can only be used for signature verification.`;
                        let compromisedTooltipText = c('PGP Key info')
                            .t`${emailAddress} has marked this key as compromised. This key cannot be used neither for encryption nor for signature verification.`;
                        if (isTrusted) {
                            compromisedTooltipText += ' ' + untrustKeyText;
                        }
                        const wkdKeyTooltipText = c('PGP Key info').t`External key automatically fetched via WKD.`;
                        const kooKeyTooltipText = c('PGP Key info')
                            .t`External key automatically fetched from keys.openpgp.org.`;

                        const list = [
                            {
                                text: c('Action').t`Download`,
                                onClick: () => {
                                    const blob = new Blob([armoredPublicKey], {
                                        type: 'text/plain',
                                    });
                                    const filename = `publickey - ${model.emailAddress} - 0x${fingerprint
                                        .slice(0, 8)
                                        .toUpperCase()}.asc`;

                                    downloadFile(blob, filename);
                                },
                            },
                        ];
                        if (canBePrimary) {
                            list.push({
                                text: c('Action').t`Use for sending`,
                                onClick: () => {
                                    const pinnedKeyIndex = model.publicKeys.pinnedKeys.findIndex(
                                        (key) => key.getFingerprint() === fingerprint
                                    );
                                    const reOrderedPinnedKeys =
                                        pinnedKeyIndex !== -1
                                            ? move(model.publicKeys.pinnedKeys, pinnedKeyIndex, 0)
                                            : model.publicKeys.pinnedKeys;
                                    setModel({
                                        ...model,
                                        publicKeys: {
                                            ...model.publicKeys,
                                            pinnedKeys: reOrderedPinnedKeys,
                                            verifyingPinnedKeys: getVerifyingKeys(
                                                reOrderedPinnedKeys,
                                                model.compromisedFingerprints
                                            ),
                                        },
                                    });
                                },
                            });
                        }
                        if (canBeTrusted) {
                            list.push({
                                text: c('Action').t`Trust`,
                                onClick: () => {
                                    const trustedFingerprints = new Set(model.trustedFingerprints);
                                    trustedFingerprints.add(fingerprint);
                                    const trustedKey = model.publicKeys.apiKeys.find(
                                        (key) => key.getFingerprint() === fingerprint
                                    );
                                    if (trustedKey) {
                                        setModel({
                                            ...model,
                                            encrypt: true,
                                            publicKeys: {
                                                ...model.publicKeys,
                                                pinnedKeys: [...model.publicKeys.pinnedKeys, trustedKey],
                                                verifyingPinnedKeys: [
                                                    ...model.publicKeys.verifyingPinnedKeys,
                                                    trustedKey,
                                                ],
                                            },
                                            trustedFingerprints,
                                        });
                                    }
                                },
                            });
                        }

                        if (canBeUntrusted) {
                            list.push({
                                text: c('Action').t`Untrust`,
                                onClick: () => {
                                    const trustedFingerprints = new Set(model.trustedFingerprints);
                                    trustedFingerprints.delete(fingerprint);
                                    const pinnedKeys = model.publicKeys.pinnedKeys.filter(
                                        (key) => key.getFingerprint() !== fingerprint
                                    );
                                    const verifyingPinnedKeys = model.publicKeys.verifyingPinnedKeys.filter(
                                        (key) => key.getFingerprint() !== fingerprint
                                    );
                                    setModel({
                                        ...model,
                                        publicKeys: {
                                            ...model.publicKeys,
                                            pinnedKeys,
                                            verifyingPinnedKeys,
                                        },
                                        trustedFingerprints,
                                    });
                                },
                            });
                        }
                        if (isUploaded) {
                            list.push({
                                text: c('Action').t`Remove`,
                                onClick: () => {
                                    const trustedFingerprints = new Set(model.trustedFingerprints);
                                    const encryptionCapableFingerprints = new Set(model.encryptionCapableFingerprints);
                                    trustedFingerprints.delete(fingerprint);
                                    encryptionCapableFingerprints.delete(fingerprint);
                                    const pinnedKeys = model.publicKeys.pinnedKeys.filter(
                                        (publicKey) => publicKey.getFingerprint() !== fingerprint
                                    );
                                    const hasEncryptionKeys =
                                        model.publicKeys.apiKeys.length > 0 || pinnedKeys.length > 0;

                                    setModel({
                                        ...model,
                                        // If no more encryption keys are available, then we switch off the encryption toggle.
                                        encrypt: hasEncryptionKeys ? model.encrypt : undefined,
                                        trustedFingerprints,
                                        encryptionCapableFingerprints,
                                        publicKeys: {
                                            ...model.publicKeys,
                                            pinnedKeys,
                                            verifyingPinnedKeys: model.publicKeys.verifyingPinnedKeys.filter(
                                                (publicKey) => publicKey.getFingerprint() !== fingerprint
                                            ),
                                        },
                                    });
                                },
                            });
                        }

                        const cells = [
                            <div key={fingerprint} title={fingerprint} className="flex flex-nowrap">
                                <ContactKeyWarningIcon
                                    className="mr-2 shrink-0 self-center my-auto"
                                    publicKey={publicKey}
                                    emailAddress={model.emailAddress}
                                    isInternal={model.isPGPInternal}
                                    supportsEncryption={supportsEncryption}
                                />
                                <span className="flex-1 text-ellipsis">{fingerprint}</span>
                            </div>,
                            !viewportWidth['<=small'] &&
                                (isValid(creation) ? format(creation, 'PP', { locale: dateLocale }) : '-'),
                            !viewportWidth.xsmall &&
                                (isValid(expiration) ? format(expiration, 'PP', { locale: dateLocale }) : '-'),
                            !viewportWidth['<=small'] && algo,
                            <Fragment key={fingerprint}>
                                {isPrimary ? (
                                    <Badge
                                        type="primary"
                                        data-testid="primary-key-label"
                                        tooltip={primaryKeyTooltipText}
                                    >
                                        {primaryText}
                                    </Badge>
                                ) : null}
                                {isObsolete && !isCompromised ? (
                                    <Badge
                                        type="warning"
                                        url={getKnowledgeBaseUrl('/download-public-private-key')}
                                        tooltip={obsoleteTooltipText}
                                    >
                                        {obsoleteText}
                                    </Badge>
                                ) : null}
                                {isCompromised ? (
                                    <Badge
                                        type="error"
                                        url={getKnowledgeBaseUrl('/download-public-private-key')}
                                        tooltip={compromisedTooltipText}
                                    >
                                        {compromisedText}
                                    </Badge>
                                ) : null}
                                {isWKD ? (
                                    <Badge type="origin" tooltip={wkdKeyTooltipText} data-testid="wkd-origin-label">
                                        {wkdText}
                                    </Badge>
                                ) : null}
                                {isKOO ? (
                                    <Badge type="origin" tooltip={kooKeyTooltipText} data-testid="koo-origin-label">
                                        {kooText}
                                    </Badge>
                                ) : null}
                                {isTrusted ? <Badge type="success">{trustedText}</Badge> : null}
                                {isRevoked ? <Badge type="error">{revokedText}</Badge> : null}
                                {isExpired ? <Badge type="error">{expiredText}</Badge> : null}
                            </Fragment>,
                            <DropdownActions key={fingerprint} size="small" list={list} />,
                        ].filter(Boolean);
                        return <TableRow key={fingerprint} cells={cells} />;
                    }
                )}
            </TableBody>
        </Table>
    );
};

export default ContactKeysTable;

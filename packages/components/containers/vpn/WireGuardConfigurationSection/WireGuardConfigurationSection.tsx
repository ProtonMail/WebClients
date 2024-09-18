import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { Point, utils } from '@noble/ed25519';
import { c } from 'ttag';

import { Button, CircleLoader, Href } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { readableTime } from '@proton/shared/lib/helpers/time';
import type { Logical } from '@proton/shared/lib/vpn/Logical';

import {
    ConfirmModal,
    ErrorButton,
    InputFieldTwo,
    Option,
    Radio,
    SelectTwo,
    TextArea,
    useModalTwoStatic,
} from '../../../components';
import Details from '../../../components/container/Details';
import Row from '../../../components/container/Row';
import Summary from '../../../components/container/Summary';
import { getObjectKeys } from '../../../helpers';
import { getCountryOptions, getLocalizedCountryByAbbr } from '../../../helpers/countries';
import {
    useApi,
    useApiResult,
    useModals,
    useNotifications,
    useUser,
    useUserSettings,
    useUserVPN,
    useVPNLogicals,
} from '../../../hooks';
import { SettingsParagraph, SettingsSectionWide } from '../../account';
import type { Certificate } from '../Certificate';
import { CATEGORY } from '../OpenVPNConfigurationSection/ConfigsTable';
import OpenVPNConfigurationSection from '../OpenVPNConfigurationSection/OpenVPNConfigurationSection';
import { getFlagSvg } from '../flag';
import type { CertificateDTO, CertificateDeletionParams, CertificateGenerationParams } from './Certificate';
import type { KeyPair } from './KeyPair';
import WireGuardCreationModal from './WireGuardCreationModal';
import { deleteCertificates, generateCertificate, getKey, queryVPNClientConfig } from './api';
import { CURVE } from './curve';
import type { FeatureFlagsConfig, FeatureOption, FeatureSelection, FeaturesConfig, FeaturesValues } from './feature';
import {
    clientConfigKeys,
    formatFeatureShortName,
    formatFeatureValue,
    getKeyOfCheck,
    initialFeaturesConfig,
    isFeatureSelection,
} from './feature';
import { normalize } from './normalize';
import useCertificates from './useCertificates';

enum PLATFORM {
    MACOS = 'macOS',
    LINUX = 'Linux',
    WINDOWS = 'Windows',
    ANDROID = 'Android',
    IOS = 'iOS',
    ROUTER = 'Router',
}

interface Peer {
    name: string;
    publicKey: string;
    ip: string;
    label: string;
}

interface ExtraCertificateFeatures {
    peerName: Peer['name'];
    peerPublicKey: Peer['publicKey'];
    peerIp: Peer['ip'];
    label: Peer['label'];
    platform: PLATFORM;
}

const isExtraFeatureKey = getKeyOfCheck<ExtraCertificateFeatures>(['peerIp', 'peerName', 'peerPublicKey', 'platform']);

// From https://github.com/paulmillr/noble-ed25519/blob/d87d6e953304c9d4dbfb275e8e67a0c975d3262b/index.js
const bytesToNumberLE = (uint8a: Uint8Array) => {
    let value = BigInt(0);

    for (let i = 0; i < uint8a.length; i++) {
        value += BigInt(uint8a[i]) << (BigInt(8) * BigInt(i));
    }

    return value;
};

const unarmor = (key: string): string => `\n${key}\n`.replace(/\n---.+\n/g, '').replace(/\s/g, '');

const randomPrivateKey = () => {
    if (!CURVE) {
        throw new Error('BigInt not supported');
    }

    let i = 1024;

    while (i--) {
        const b32 = crypto.getRandomValues(new Uint8Array(32));
        const num = bytesToNumberLE(b32);

        if (num > BigInt(1) && num < CURVE.n) {
            return b32;
        }
    }

    throw new Error('Valid private key was not found in 1024 iterations. PRNG is broken');
};

const getPublicKey = async (privateKey: Uint8Array): Promise<Uint8Array> => {
    const key = await Point.fromPrivateKey(privateKey);

    return key.toRawBytes();
};

const getFeatureLink = (feature: FeatureOption<any>) =>
    feature.url ? (
        <>
            {' '}
            &nbsp; <Href className="text-no-bold" href={feature.url}>{c('Info').t`Learn more`}</Href>
        </>
    ) : (
        ''
    );

const getConfigTemplate = (
    interfacePrivateKey: string,
    name: string | undefined,
    features: Partial<FeaturesValues & ExtraCertificateFeatures> | undefined,
    peer: Peer
) => `[Interface]${name ? `\n# Key for ${name}` : ''}${getObjectKeys(features)
    .map((key) =>
        isExtraFeatureKey(key) ? '' : `\n# ${formatFeatureShortName(key)} = ${formatFeatureValue(features, key)}`
    )
    .join('')}
PrivateKey = ${interfacePrivateKey}
Address = 10.2.0.2/32
DNS = 10.2.0.1

[Peer]
# ${features?.peerName || peer.name}
PublicKey = ${features?.peerPublicKey || peer.publicKey}
AllowedIPs = ${features?.platform === PLATFORM.WINDOWS ? '0.0.0.0/1, 128.0.0.0/1' : '0.0.0.0/0'}
Endpoint = ${features?.peerIp || peer.ip}:51820`;

const privateKeyPlaceholder = '*****';

const getCertificateModel = (
    certificateDto: CertificateDTO & { id?: string },
    peer: Peer,
    privateKey?: string,
    id?: string
): Certificate => {
    if (!id && !certificateDto.id) {
        certificateDto.id = `c${Date.now()}-${Math.random()}`;
    }

    const name = certificateDto?.DeviceName;
    const features = certificateDto?.Features;

    return {
        id: `${id || certificateDto.id}`,
        name,
        features,
        serialNumber: certificateDto.SerialNumber,
        privateKey: privateKey || privateKeyPlaceholder,
        publicKey: certificateDto.ClientKey,
        publicKeyFingerprint: certificateDto.ClientKeyFingerprint,
        expirationTime: certificateDto.ExpirationTime,
        config: getConfigTemplate(privateKey || privateKeyPlaceholder, name, features, peer),
    };
};

const paginationSize = 50;

const formatServerName = (bestServerName: string, alt: (code: string) => string | undefined) => {
    const countryCode = bestServerName.split(/#/g)[0];
    const flag = getFlagSvg(countryCode);

    return (
        <>
            {flag && <img width={20} className="mx-2 border" src={flag} alt={alt(countryCode)} />}
            <strong className="align-middle">{bestServerName}</strong>
        </>
    );
};

const getX25519PrivateKey = async (privateKey: string): Promise<string> => {
    const sha512 = (await utils.sha512(base64StringToUint8Array(privateKey))).slice(0, 32);
    sha512[0] &= 0xf8;
    sha512[31] &= 0x7f;
    sha512[31] |= 0x40;
    return uint8ArrayToBase64String(sha512);
};

const WireGuardConfigurationSection = () => {
    const [platform, setPlatform] = useState(PLATFORM.ANDROID);
    const [featuresConfig, setFeaturesConfig] = useState<FeaturesConfig>(initialFeaturesConfig);
    const api = useApi();
    const [peer, setPeer] = useState<Peer>({
        name: '',
        publicKey: '',
        ip: '',
        label: '',
    });
    const certificateCacheRef = useRef<Record<string, Certificate>>({});
    const certificateCache = certificateCacheRef.current;
    const [logical, setLogical] = useState<Logical | undefined>();
    const [creationModal, handleShowCreationModal] = useModalTwoStatic(WireGuardCreationModal);
    const [creating, setCreating] = useState<boolean>(false);
    const [removing, setRemoving] = useState<Record<string, boolean>>({});
    const [removedCertificates, setRemovedCertificates] = useState<string[]>([]);
    const [currentCertificate, setCurrentCertificate] = useState<string | undefined>();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [{ hasPaidVpn }] = useUser();
    const [userSettings] = useUserSettings();
    const { result, loading: vpnLoading, fetch: fetchUserVPN } = useUserVPN();
    const userVPN = result?.VPN;
    const nameInputRef = useRef<HTMLInputElement>(null);
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const { result: clientConfig = { FeatureFlags: {} as FeatureFlagsConfig } } = useApiResult<
        { FeatureFlags: FeatureFlagsConfig },
        typeof queryVPNClientConfig
    >(queryVPNClientConfig, []);
    const {
        loading: logicalsLoading,
        result: logicalsResult = { LogicalServers: [] },
        fetch: fetchLogicals,
    } = useVPNLogicals();
    const [limit, setLimit] = useState(paginationSize);
    const { loading: certificatesLoading, result: certificatesResult, moreToLoad } = useCertificates(limit);

    const countryOptions = getCountryOptions(userSettings);

    const logicalInfoLoading = logicalsLoading || vpnLoading;
    const maxTier = userVPN?.MaxTier || 0;
    const logicals = useMemo(
        () =>
            ((!logicalInfoLoading && logicalsResult.LogicalServers) || [])
                .map((logical) => ({
                    ...logical,
                    Servers: (logical.Servers || []).filter((server) => server.X25519PublicKey),
                }))
                .filter((logical) => logical.Servers.length),
        [logicalInfoLoading, logicalsResult.LogicalServers]
    );
    const bestLogicals = logicals
        .filter((server) => server.Tier <= maxTier && (server.Features & 3) === 0)
        .sort((a, b) => a.Score - b.Score);
    const bestLogical = bestLogicals[0];
    const bestServerName = bestLogical?.Name;
    const formattedBestServerName = bestServerName
        ? formatServerName(bestServerName, (code) => getLocalizedCountryByAbbr(code, countryOptions))
        : '';

    const getCertificates = (): Certificate[] => {
        certificatesResult.forEach((certificateDto) => {
            if (
                removedCertificates.indexOf(certificateDto.ClientKeyFingerprint) !== -1 ||
                certificateDto.ExpirationTime <
                    (certificateCache[certificateDto.ClientKeyFingerprint]?.expirationTime || 0)
            ) {
                return;
            }

            certificateCache[certificateDto.ClientKeyFingerprint] = getCertificateModel(certificateDto, peer);
        });

        certificates.forEach((certificate) => {
            if (
                removedCertificates.indexOf(certificate.publicKeyFingerprint) !== -1 ||
                certificate.expirationTime < (certificateCache[certificate.publicKeyFingerprint]?.expirationTime || 0)
            ) {
                return;
            }

            certificateCache[certificate.publicKeyFingerprint] = certificate;
        });

        return Object.values(certificateCache);
    };

    const setFeature = <K extends keyof FeaturesConfig>(key: K, value: FeaturesConfig[K]['value']) => {
        setFeaturesConfig({
            ...featuresConfig,
            [key]: {
                ...featuresConfig[key],
                value,
            },
        });
    };

    const getKeyPair = async (): Promise<{ privateKey: string; publicKey: string }> => {
        try {
            const privateKey = randomPrivateKey();

            return {
                privateKey: uint8ArrayToBase64String(privateKey),
                publicKey: uint8ArrayToBase64String(await getPublicKey(privateKey)),
            };
        } catch (e) {
            console.warn(e);
            console.info(
                'Fallback to server-side generated key. Upgrade to a modern browser, to generate right from your device.'
            );

            const { PrivateKey, PublicKey } = await api<KeyPair>(getKey());

            return { privateKey: unarmor(PrivateKey), publicKey: unarmor(PublicKey) };
        }
    };

    const getToggleCallback = (certificate: Certificate) => (event: ChangeEvent<HTMLDetailsElement>) => {
        if (!event?.target?.hasAttribute('open')) {
            return;
        }

        if (certificate.id === currentCertificate) {
            return;
        }

        setCurrentCertificate(certificate.id);
    };

    const queryCertificate = (
        publicKey: string,
        deviceName?: string | null | undefined,
        features?: Record<string, string | number | boolean | null> | undefined,
        options: Partial<CertificateGenerationParams> = {}
    ): Promise<CertificateDTO> =>
        api<CertificateDTO>(
            generateCertificate({
                ClientPublicKey: publicKey,
                Mode: 'persistent',
                DeviceName: deviceName,
                Features: features,
                ...options,
            })
        );

    const getFeatureKeys = () =>
        getObjectKeys(featuresConfig).filter(
            (key) => maxTier >= (featuresConfig[key].tier || 0) && clientConfig?.FeatureFlags?.[clientConfigKeys[key]]
        );
    const getFeatureValues = useCallback(
        (addedPeer?: Peer) => {
            const peerFeatures = addedPeer || peer;
            const label = peerFeatures?.label;

            return Object.assign(
                label ? { Bouncing: label } : {},
                Object.fromEntries(
                    getFeatureKeys().map((key) => [
                        key,
                        ((featuresConfig[key].transform || ((v: any) => v)) as <T>(value: T) => T)(
                            featuresConfig[key].value
                        ),
                    ])
                ),
                peerFeatures
                    ? {
                          peerName: peerFeatures.name,
                          peerIp: peerFeatures.ip,
                          peerPublicKey: peerFeatures.publicKey,
                          platform,
                      }
                    : {}
            );
        },
        [featuresConfig, peer, platform]
    );

    const getDownloadCallback = (certificate: Certificate) => () => {
        if (creating) {
            return;
        }

        const serverName = `${certificate?.features?.peerName || peer.name}`.substring(0, 20);

        downloadFile(
            new Blob([certificate.config || '']),
            normalize((certificate.name || 'wg') + '-' + serverName) + '.conf'
        );
    };

    const add = async (addedPeer?: Peer, silent = false) => {
        if (creating) {
            return;
        }

        setCreating(true);

        try {
            const serverName = addedPeer?.name;

            if (!silent && serverName) {
                handleShowCreationModal({
                    open: true,
                    serverName: serverName,
                    text: undefined,
                    config: undefined,
                    onClose() {
                        silent = true;
                        handleShowCreationModal({ open: false });
                    },
                });
            }

            try {
                const { privateKey, publicKey } = await getKeyPair();
                const x25519PrivateKey = await getX25519PrivateKey(privateKey);
                const deviceName = nameInputRef?.current?.value || '';
                const certificate = await queryCertificate(publicKey, deviceName, getFeatureValues(addedPeer));

                if (!certificate.DeviceName) {
                    certificate.DeviceName = deviceName;
                }

                const newCertificate = getCertificateModel(certificate, peer, x25519PrivateKey);
                const id = newCertificate.id;
                let name = newCertificate.name || newCertificate.publicKeyFingerprint || newCertificate.publicKey;

                if (name.length > 46) {
                    name = name.substring(0, 21) + '…' + name.substring(name.length - 21);
                }

                if (!silent) {
                    const downloadCallback = getDownloadCallback(newCertificate);

                    handleShowCreationModal({
                        open: true,
                        serverName: serverName,
                        // translator: name a name given by the user to a config file
                        text: c('Success notification')
                            .t`Config "${name}" created, note that the private key is not stored and won't be shown again, you should copy or download this config.`,
                        config: newCertificate?.config || '',
                        onDownload() {
                            downloadCallback();
                            handleShowCreationModal({ open: false });
                        },
                        onClose() {
                            handleShowCreationModal({ open: false });
                        },
                    });
                }

                flushSync(() => {
                    setCurrentCertificate(id);
                    setCertificates([...(certificates || []), newCertificate]);
                });

                document.querySelector(`[data-certificate-id="${id}"]`)?.scrollIntoView();

                if (nameInputRef?.current) {
                    nameInputRef.current.value = '';
                }
            } catch (e) {
                if (!silent && serverName) {
                    handleShowCreationModal({ open: false });
                }

                throw e;
            }
        } finally {
            setCreating(false);
        }
    };

    const selectLogical = useCallback(
        async (logical: Logical, silent = false, doAdd = false) => {
            const servers = logical?.Servers || [];
            const numberOfServers = servers.length;
            const server = servers[Math.floor(Math.random() * numberOfServers)];
            const serverName = logical?.Name;
            let addPromise: Promise<void> | undefined = undefined;

            if (server) {
                const newPeer = {
                    name: serverName,
                    publicKey: `${server.X25519PublicKey}`,
                    ip: server.EntryIP,
                    label: server.Label || '',
                };

                if (doAdd) {
                    addPromise = add(newPeer, silent);
                }

                if (peer.ip !== server.EntryIP) {
                    setPeer(newPeer);
                }
            }

            setLogical({ ...logical });

            if (addPromise) {
                await addPromise;
            }
        },
        [peer, getFeatureValues, platform, creating]
    );

    if (!logicalInfoLoading && logicals.length && typeof logical === 'undefined') {
        void selectLogical(bestLogical, true);
    }

    const createWithLogical = useCallback(
        (logical: Logical, silent = false) => selectLogical(logical, silent, true),
        [selectLogical]
    );

    const revokeCertificate = (name: string) => {
        createNotification({
            // translator: name is arbitrary name given by the user or a random key if not set
            text: c('Success notification').t`Certificate ${name} revoked`,
        });
    };

    const confirmRevocation = async (name: string) => {
        return new Promise<void>((resolve, reject) => {
            createModal(
                <ConfirmModal
                    small={false}
                    title={c('Title').t`Revoke certificate`}
                    onConfirm={resolve}
                    confirm={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>}
                    onClose={reject}
                >
                    <Alert className="mb-4" type="info">
                        {
                            // translator: name is arbitrary name given by the user or a random key if not set
                            c('Info').t`Revoke certificate ${name}`
                        }
                    </Alert>
                    <Alert className="mb-4" type="error">
                        {c('Alter').t`This will disconnect all the routers and clients using this certificate.`}
                    </Alert>
                </ConfirmModal>
            );
        });
    };

    const getDeleteFilter = (certificate: Certificate): CertificateDeletionParams => {
        if (certificate.serialNumber) {
            return { SerialNumber: certificate.serialNumber };
        }

        if (certificate.publicKeyFingerprint) {
            return { ClientPublicKeyFingerprint: certificate.publicKeyFingerprint };
        }

        return { ClientPublicKey: certificate.publicKey };
    };

    const askForRevocation = (certificate: Certificate) => async () => {
        const key = certificate.publicKeyFingerprint || certificate.publicKey || certificate.id;

        setRemoving({
            ...removing,
            [key]: true,
        });

        const end = () => {
            const newValues = { ...removing };
            delete newValues[key];

            setRemoving(newValues);
        };

        try {
            const name = certificate.name || certificate.publicKeyFingerprint || certificate.publicKey || '';
            await confirmRevocation(name);
            const { Count } = await api(deleteCertificates(getDeleteFilter(certificate)));

            if (!Count) {
                createNotification({
                    type: 'warning',
                    // translator: name is arbitrary name given by the user or a random key if not set
                    text: c('Error notification').t`Certificate ${name} not found or already revoked`,
                });
                end();

                return;
            }

            delete certificateCache[certificate.publicKeyFingerprint];
            setRemovedCertificates([...removedCertificates, certificate.publicKeyFingerprint]);
            setCertificates(certificates.filter((c) => c.id !== certificate.id));
            revokeCertificate(name);
        } catch (e) {
            // Abort revocation
        } finally {
            end();
        }
    };

    const handleFormSubmit = (e: FormEvent) => {
        e.preventDefault();

        return createWithLogical(bestLogical);
    };

    const getExtendCallback = (certificate: Certificate) => async () => {
        if (creating) {
            return;
        }

        setCreating(true);

        try {
            const renewedCertificate = await queryCertificate(
                certificate.publicKey,
                certificate.name,
                certificate.features || getFeatureValues(),
                { Renew: true }
            );

            if (!renewedCertificate.DeviceName) {
                renewedCertificate.DeviceName = nameInputRef?.current?.value || '';
            }

            const newCertificate = getCertificateModel(renewedCertificate, peer, certificate.privateKey);
            setCertificates([...(certificates || []), newCertificate]);
            setCurrentCertificate(newCertificate.id);
            const formattedExpirationDate = readableTime(newCertificate.expirationTime, {
                format: 'PPp',
            });
            createNotification({
                // translator: formattedExpirationDate is a date+time such as "Jan 31, 2023, 7:57 PM" with format appropriately localized to match current locale
                text: c('Success notification').t`Certificate extended until ${formattedExpirationDate}`,
            });
        } finally {
            setCreating(false);
        }
    };

    useEffect(() => {
        fetchUserVPN(30_000);
        fetchLogicals(30_000);
    }, [hasPaidVpn]);

    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                {c('Info').t`These configurations are provided to work with WireGuard routers and official clients.`}
            </SettingsParagraph>
            {creationModal}
            {logicalInfoLoading || certificatesLoading ? (
                <div aria-busy="true" className="text-center mb-4">
                    <CircleLoader />
                </div>
            ) : (
                <>
                    {getCertificates().map((certificate) => {
                        const name = certificate.name || certificate.publicKeyFingerprint || certificate.publicKey;
                        const expirationDate = readableTime(certificate.expirationTime);
                        // translator: expirationDate is a date such as "Dec 11, 2022" (formatted according to current language)
                        const expirationString = c('Info').t`expires ${expirationDate}`;
                        const serverName = certificate?.features?.peerName || peer.name;

                        return (
                            <Details
                                data-certificate-id={certificate.id}
                                key={certificate.id}
                                open={certificate.id === currentCertificate}
                                onToggle={getToggleCallback(certificate)}
                            >
                                <Summary>
                                    <Row className="justify-space-between" collapseOnMobile={false}>
                                        <div className="text-ellipsis">{name}</div>
                                        <div className="shrink-0">
                                            &nbsp;&nbsp;
                                            {expirationString}
                                            &nbsp;&nbsp;
                                            {certificate.serialNumber ||
                                            certificate.publicKeyFingerprint ||
                                            certificate.publicKey ? (
                                                removing[
                                                    certificate.publicKeyFingerprint ||
                                                        certificate.publicKey ||
                                                        certificate.id
                                                ] ? (
                                                    <CircleLoader />
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="label-stack-item-delete shrink-0"
                                                        onClick={askForRevocation(certificate)}
                                                        title={
                                                            // translator: name is arbitrary name given by the user or a random key if not set
                                                            c('Action').t`Revoke ${name}`
                                                        }
                                                    >
                                                        <Icon
                                                            name="cross"
                                                            size={3}
                                                            className="label-stack-item-delete-icon"
                                                            alt={c('Action').t`Revoke`}
                                                        />
                                                    </button>
                                                )
                                            ) : (
                                                ''
                                            )}
                                        </div>
                                    </Row>
                                </Summary>
                                <div>
                                    <Button loading={creating} onClick={getExtendCallback(certificate)}>{c('Action')
                                        .t`Extend`}</Button>
                                    {certificate?.config && (
                                        <Button
                                            className="ml-4"
                                            loading={creating}
                                            onClick={getDownloadCallback(certificate)}
                                        >{c('Action').t`Download`}</Button>
                                    )}
                                    <label className="block my-2">
                                        {c('Label').t`Config to connect to ${serverName}`}
                                        <TextArea
                                            className="block mt-2"
                                            value={certificate?.config}
                                            readOnly
                                            rows={14}
                                        />
                                    </label>
                                </div>
                            </Details>
                        );
                    })}
                    {moreToLoad && (
                        <div aria-busy="true" className="text-center mt-4">
                            <Button
                                type="button"
                                onClick={() => setLimit(limit + paginationSize)}
                                title={c('Action').t`Load more`}
                            >{c('Action').t`Load more`}</Button>
                        </div>
                    )}
                    <form onSubmit={handleFormSubmit} className="mt-8">
                        <h3 className="mt-8 mb-2">{c('Title').t`1. Give a name to the config to be generated`}</h3>
                        <InputFieldTwo
                            id="certificate-device-name"
                            ref={nameInputRef}
                            label={
                                <>
                                    {c('Label').t`Device/certificate name`}
                                    <Info
                                        className="ml-1"
                                        title={c('Info')
                                            .t`A name to help you identify where you use it so you can easily revoke it or extend it later.`}
                                    />
                                </>
                            }
                            placeholder={c('Label').t`Choose a name for the generated certificate file`}
                            maxLength={100}
                        />
                        <h3 className="mt-8 mb-2">{c('Title').t`2. Select platform`}</h3>
                        <div className="flex flex-column md:flex-row">
                            {[
                                {
                                    value: PLATFORM.ANDROID,
                                    label: c('Option').t`Android`,
                                },
                                {
                                    value: PLATFORM.IOS,
                                    label: c('Option').t`iOS`,
                                },
                                {
                                    value: PLATFORM.WINDOWS,
                                    label: c('Option').t`Windows`,
                                },
                                {
                                    value: PLATFORM.MACOS,
                                    label: c('Option').t`macOS`,
                                },
                                {
                                    value: PLATFORM.LINUX,
                                    label: c('Option').t`GNU/Linux`,
                                },
                                {
                                    value: PLATFORM.ROUTER,
                                    label: c('Option').t`Router`,
                                },
                            ].map(({ value, label }) => {
                                return (
                                    <div key={'wg-' + value} className="mr-8 mb-4">
                                        <Radio
                                            id={'wg-platform-' + value}
                                            onChange={() => setPlatform(value)}
                                            checked={platform === value}
                                            name="platform"
                                            className="flex inline-flex *:self-center mb-2"
                                        >
                                            {label}
                                        </Radio>
                                    </div>
                                );
                            })}
                        </div>
                        <h3 className="mt-8 mb-2">{c('Title').t`3. Select VPN options`}</h3>
                        {getFeatureKeys().map((key) => (
                            <div className="mb-4" key={'wg-feature-' + key}>
                                <label className="field-two-container w-full" htmlFor={'wg-feature-' + key}>
                                    {isFeatureSelection(featuresConfig[key]) ? (
                                        <>
                                            <div className="flex field-two-label-container justify-space-between flex-nowrap items-end">
                                                <span className="field-two-label">
                                                    {featuresConfig[key].name}
                                                    {getFeatureLink(featuresConfig[key])}
                                                </span>
                                            </div>
                                            <SelectTwo
                                                id={'wg-feature-' + key}
                                                key={'wg-feature-' + key}
                                                value={featuresConfig[key].value}
                                                onValue={(value) => setFeature(key, value)}
                                            >
                                                {(featuresConfig[key] as FeatureSelection).values.map((option) => (
                                                    <Option
                                                        key={'wg-feature-' + key + '-' + option.value}
                                                        title={option.name}
                                                        value={option.value}
                                                    />
                                                ))}
                                            </SelectTwo>
                                        </>
                                    ) : (
                                        <>
                                            <Toggle
                                                key={'feature-' + key}
                                                id={'feature-' + key}
                                                checked={!!featuresConfig[key].value}
                                                onChange={() => setFeature(key, !featuresConfig[key].value)}
                                            />
                                            &nbsp; &nbsp;
                                            {featuresConfig[key].name}
                                            {getFeatureLink(featuresConfig[key])}
                                        </>
                                    )}
                                </label>
                            </div>
                        ))}
                        {logical && (
                            <>
                                <h3 className="mt-8 mb-2">{c('Title').t`4. Select a server to connect to`}</h3>

                                <div className="mb-8">
                                    {bestServerName && (
                                        <>
                                            <p className="mt-0">
                                                {c('Info')
                                                    .jt`Use the best server according to current load and position: ${formattedBestServerName}`}
                                            </p>
                                            <div className="mt-4">
                                                <Button type="submit" color="norm" loading={creating}>{c('Action')
                                                    .t`Create`}</Button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <p className="my-8">{c('Info').t`Or select a particular server:`}</p>

                                <OpenVPNConfigurationSection
                                    onSelect={createWithLogical}
                                    selecting={creating}
                                    listOnly={true}
                                    excludedCategories={[CATEGORY.COUNTRY]}
                                />
                            </>
                        )}
                    </form>
                </>
            )}
        </SettingsSectionWide>
    );
};

export default WireGuardConfigurationSection;

import { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import type { ModalProps } from '@proton/components';
import { Icon, Prompt } from '@proton/components';
import { IcExclamationTriangleFilled } from '@proton/icons/icons/IcExclamationTriangleFilled';

interface Props extends ModalProps {
    url: string;
    onClose: () => void;
}

const LinkWarningModal = ({ url, onClose, ...modalProps }: Props) => {
    const [showSafetyInfo, setShowSafetyInfo] = useState(false);

    const parseUrl = (url: string) => {
        try {
            const urlObj = new URL(url);
            const domainParts = urlObj.hostname.split('.');
            const hasExcessiveSubdomains = domainParts.length > 4;
            const rootDomain = domainParts.slice(-2).join('.');
            const subdomains = domainParts.slice(0, -2);

            return {
                protocol: urlObj.protocol,
                domain: urlObj.hostname,
                rootDomain,
                subdomains,
                path: urlObj.pathname + urlObj.search + urlObj.hash,
                isSecure: urlObj.protocol === 'https:',
                hasExcessiveSubdomains,
                subdomainCount: subdomains.length,
            };
        } catch {
            return null;
        }
    };

    const urlParts = parseUrl(url);

    if (!urlParts) {
        return (
            <Prompt
                {...modalProps}
                title={c('collider_2025: Title').t`Invalid Link`}
                buttons={[
                    <Button key="close" onClick={onClose} className={'w-full'}>
                        {c('collider_2025: Button').t`Close`}
                    </Button>,
                ]}
            >
                <p className="m-0">{c('collider_2025: Error').t`The provided URL is invalid.`}</p>
            </Prompt>
        );
    }

    return (
        <Prompt
            {...modalProps}
            title={c('collider_2025: Title').t`Opening External Link`}
            buttons={[
                <Button key="close" onClick={onClose} className={'w-full'}>
                    {c('collider_2025: Button').t`Close`}
                </Button>,
            ]}
        >
            <div className="flex flex-column flex-nowrap gap-4">
                <p className="m-0">{c('collider_2025: Info').t`You are about to visit an external website:`}</p>

                {/* URL Display with Security Emphasis */}
                <div className="border rounded p-3 bg-weak">
                    {/* Protocol Display */}
                    <div className="flex flex-row flex-align-items-center gap-1 mb-1">
                        {urlParts.isSecure ? (
                            <>
                                <Icon name="shield" className="color-success" size={4} />
                                <span className="text-sm color-success text-bold">https://</span>
                            </>
                        ) : (
                            <>
                                <Icon name="shield" className="warning" size={4} />
                                <span className="text-sm color-danger text-bold">http://</span>
                            </>
                        )}
                    </div>

                    {/* Domain - Emphasized */}
                    <div className="mb-1">
                        <div
                            className={`text-lg text-bold text-break ${urlParts.hasExcessiveSubdomains ? 'color-warning' : ''}`}
                        >
                            {urlParts.hasExcessiveSubdomains ? (
                                <>
                                    <span className="color-warning">{urlParts.subdomains.join('.')}</span>
                                    <span className="color-weak">.</span>
                                    <span>{urlParts.rootDomain}</span>
                                </>
                            ) : (
                                urlParts.domain
                            )}
                        </div>
                        {urlParts.hasExcessiveSubdomains && (
                            <div className="flex flex-row flex-align-items-center gap-1 color-warning text-sm mt-1">
                                <Icon name="exclamation-filled" size={3} />
                                <span>
                                    {c('collider_2025: Warning').ngettext(
                                        msgid`Suspicious: ${urlParts.subdomainCount} subdomain`,
                                        `Suspicious: ${urlParts.subdomainCount} subdomains`,
                                        urlParts.subdomainCount
                                    )}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Path - De-emphasized */}
                    <div className="text-sm color-weak text-break">{urlParts.path}</div>
                </div>

                {/* Safety Information Toggle */}
                <Button
                    shape="ghost"
                    size="small"
                    className="text-left"
                    onClick={() => setShowSafetyInfo(!showSafetyInfo)}
                >
                    <div className="flex flex-row flex-align-items-center gap-1">
                        <span className="color-primary">
                            {showSafetyInfo
                                ? c('collider_2025: Action').t`Hide safety information`
                                : c('collider_2025: Action').t`Show safety information`}
                        </span>
                        <Icon
                            name="chevron-down"
                            size={3}
                            className={`color-primary ${showSafetyInfo ? 'rotate-180' : ''}`}
                        />
                    </div>
                </Button>

                {/* Safety Information */}
                {showSafetyInfo && (
                    <div className="border rounded p-3">
                        <h4 className="text-bold mb-2">{c('collider_2025: Info').t`How to identify safe links:`}</h4>
                        <div className="flex flex-column gap-2 text-sm">
                            <div className="flex flex-row flex-nowrap gap-2">
                                <Icon name="shield" className="color-success mt-0.5 flex-item-noshrink" size={4} />
                                <span>
                                    <span className="text-bold">https://</span> -{' '}
                                    {c('collider_2025: Info').t`Secure connection (encrypted)`}
                                </span>
                            </div>
                            <div className="flex flex-row flex-nowrap gap-2">
                                <IcExclamationTriangleFilled className={'color-warning'} />
                                <span>
                                    <span className="text-bold">{c('collider_2025: Info').t`Domain name`}</span> -{' '}
                                    {c('collider_2025: Info').t`Check this is the site you expect to visit`}
                                </span>
                            </div>
                            <div className="flex flex-row flex-nowrap gap-2">
                                <IcExclamationTriangleFilled className={'color-warning'} />
                                <span>
                                    {/* eslint-disable-next-line no-restricted-syntax */}
                                    {c('collider_2025: Info').t`Watch for misspellings (e.g., proton.me vs pr0t0n.me)`}
                                </span>
                            </div>
                            <div className="flex flex-row flex-nowrap gap-2">
                                <IcExclamationTriangleFilled className={'color-warning'} />
                                <span>
                                    {c('collider_2025: Info')
                                        .t`Be cautious of unfamiliar domains or excessive subdomains`}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Disclaimer */}
                <p className="text-sm color-weak m-0">
                    {c('collider_2025: Disclaimer')
                        .t`External links may pose security risks. We are not responsible for the content of external sites. Please proceed at your own risk.`}
                </p>

                <Href href={url}>
                    <Button color="norm" className={'w-full'} onClick={onClose}>
                        {c('collider_2025: Button').t`Open Link`}
                    </Button>
                </Href>
            </div>
        </Prompt>
    );
};

export default LinkWarningModal;

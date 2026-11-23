import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Collapsible } from '@proton/atoms/Collapsible/Collapsible';
import { CollapsibleContent } from '@proton/atoms/Collapsible/CollapsibleContent';
import { CollapsibleHeader } from '@proton/atoms/Collapsible/CollapsibleHeader';
import { CollapsibleHeaderIconButton } from '@proton/atoms/Collapsible/CollapsibleHeaderIconButton';
import { Href } from '@proton/atoms/Href/Href';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { IcExclamationFilled } from '@proton/icons/icons/IcExclamationFilled';
import { IcShield } from '@proton/icons/icons/IcShield';

import { LumoIcon } from '../LumoIcon/LumoIcon';

interface Props extends ModalProps {
    url: string;
    onClose: () => void;
}

const LinkWarningModal = ({ url, onClose, ...modalProps }: Props) => {
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

    // eslint-disable-next-line proton/restricted-syntax
    const misspellingWarning = c('collider_2025: Info').t`Watch for misspellings (e.g., proton.me vs pr0t0n.me)`;
    const urlParts = parseUrl(url);

    if (!urlParts) {
        return (
            <ModalTwo {...modalProps} onClose={onClose} size="medium">
                <ModalTwoHeader title={c('collider_2025: Title').t`Invalid Link`} />
                <ModalTwoContent>
                    <p className="m-0">{c('collider_2025: Error').t`The provided URL is invalid.`}</p>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button onClick={onClose} fullWidth>{c('collider_2025: Button').t`Close`}</Button>
                </ModalTwoFooter>
            </ModalTwo>
        );
    }

    return (
        <ModalTwo {...modalProps} onClose={onClose} size="small">
            <ModalTwoHeader title={c('collider_2025: Title').t`Opening External Link`} />
            <ModalTwoContent>
                <div className="flex flex-column flex-nowrap gap-4">
                    <p className="m-0">{c('collider_2025: Info').t`You are about to visit an external website:`}</p>

                    {/* URL Display with Security Emphasis */}
                    <div className="p-3 border radius-8 lumo-bg-control-fill">
                        {/* Protocol Display */}
                        <div className="flex flex-row items-center gap-1 mb-1">
                            {urlParts.isSecure ? (
                                <>
                                    <IcShield className="lumo-color-signal-success" size={4} />
                                    <span className="lumo-label-small lumo-color-signal-success">https://</span>
                                </>
                            ) : (
                                <>
                                    <IcShield className="warning" size={4} />
                                    <span className="lumo-label-small lumo-color-signal-danger">http://</span>
                                </>
                            )}
                        </div>

                        {/* Domain - Emphasized */}
                        <div>
                            <div
                                className={`lumo-title-medium text-break ${urlParts.hasExcessiveSubdomains ? 'lumo-color-signal-warning' : ''}`}
                            >
                                {urlParts.hasExcessiveSubdomains ? (
                                    <>
                                        <span className="lumo-color-signal-warning">
                                            {urlParts.subdomains.join('.')}
                                        </span>
                                        <span className="lumo-color-glyph-mid">.</span>
                                        <span>{urlParts.rootDomain}</span>
                                    </>
                                ) : (
                                    urlParts.domain
                                )}
                            </div>
                            {urlParts.hasExcessiveSubdomains && (
                                <div className="flex flex-row items-center gap-1 mt-1 lumo-body-small lumo-color-signal-warning">
                                    <IcExclamationFilled size={3} />
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
                        {urlParts.path !== '/' && (
                            <div className="mt-1 lumo-body-small text-break lumo-color-glyph-mid">{urlParts.path}</div>
                        )}
                    </div>

                    {/* Safety information */}
                    <Collapsible>
                        <CollapsibleHeader
                            className="lumo-color-glyph-brand-text"
                            suffix={
                                <CollapsibleHeaderIconButton className="p-1" size="small">
                                    <LumoIcon name="ChevronDown" className="lumo-color-glyph-brand-text" size={14} />
                                </CollapsibleHeaderIconButton>
                            }
                        >
                            {c('collider_2025: Info').t`Safety information`}
                        </CollapsibleHeader>
                        <CollapsibleContent className="mt-2">
                            <div className="p-3 border radius-8">
                                <h4 className="lumo-title-medium mb-2">{c('collider_2025: Info')
                                    .t`How to identify safe links:`}</h4>
                                <div className="flex flex-column gap-2 lumo-body-small">
                                    <div className="flex flex-row flex-nowrap gap-2">
                                        <IcShield className="shrink-0 mt-0.5 lumo-color-signal-success" size={4} />
                                        <span>
                                            <span className="lumo-title-small">https://</span> -{' '}
                                            {c('collider_2025: Info').t`Secure connection (encrypted)`}
                                        </span>
                                    </div>
                                    <div className="flex flex-row flex-nowrap gap-2">
                                        <LumoIcon
                                            name="TriangleExclamationPoint"
                                            className={'lumo-color-signal-warning'}
                                        />
                                        <span>
                                            <span className="lumo-title-small">{c('collider_2025: Info')
                                                .t`Domain name`}</span>{' '}
                                            - {c('collider_2025: Info').t`Check this is the site you expect to visit`}
                                        </span>
                                    </div>
                                    <div className="flex flex-row flex-nowrap gap-2">
                                        <LumoIcon
                                            name="TriangleExclamationPoint"
                                            className={'lumo-color-signal-warning'}
                                        />
                                        <span>{misspellingWarning}</span>
                                    </div>
                                    <div className="flex flex-row flex-nowrap gap-2">
                                        <LumoIcon
                                            name="TriangleExclamationPoint"
                                            className={'lumo-color-signal-warning'}
                                        />
                                        <span>
                                            {c('collider_2025: Info')
                                                .t`Be cautious of unfamiliar domains or excessive subdomains`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Disclaimer */}
                    <p className="m-0 lumo-body-small lumo-color-glyph-mid">
                        {c('collider_2025: Disclaimer')
                            .t`External links may pose security risks. We are not responsible for the content of external sites. Please proceed at your own risk.`}
                    </p>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter className="flex flex-column gap-2">
                <ButtonLike as={Href} href={url} color="norm" onClick={onClose} fullWidth>
                    {c('collider_2025: Button').t`Open Link`}
                </ButtonLike>
                <Button onClick={onClose} fullWidth>{c('collider_2025: Button').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default LinkWarningModal;

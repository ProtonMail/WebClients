import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';

import ReadonlyFieldWithCopy from '../ReadonlyFieldWithCopy';

export interface SCIMConfiguration {
    baseUrl: string;
    token: string;
    type: 'setup' | 'generated' | 'static';
}

type SetupSCIMModalProps = ModalProps & SCIMConfiguration;

const SetupSCIMModal = ({ onClose, token, type, baseUrl, ...rest }: SetupSCIMModalProps) => {
    return (
        <Modal size="large" onClose={onClose} {...rest}>
            <ModalHeader
                title={
                    type === 'setup'
                        ? c('scim: Info').t`Enter URL and token into your identity provider`
                        : c('scim: Info').t`Enter token into your identity provider`
                }
            />
            <ModalContent>
                <div className="mb-6">
                    {type === 'setup'
                        ? c('scim: Info')
                              .t`Go to your identity provider, copy and paste the data below and finish configuring SCIM for ${VPN_APP_NAME}.`
                        : c('scim: Info')
                              .t`Go to your identity provider, copy and paste the token below and re-enable SCIM for ${VPN_APP_NAME}.`}
                    <br />
                    <Href href="https://protonvpn.com/support/sso">{c('Info').t`Learn more`}</Href>
                </div>
                {type === 'setup' && (
                    <ReadonlyFieldWithCopy label={c('scim: Label').t`SCIM base URL (or tenant URL)`} value={baseUrl} />
                )}
                <ReadonlyFieldWithCopy label={c('scim: Label').t`SCIM token`} value={token} />
                <div className="rounded border p-4 flex flex-nowrap gap-2">
                    <Icon name="info-circle-filled" className="color-danger shrink-0" />
                    <p className="m-0">
                        <b>{c('scim: Info').t`Make sure you copy the above SCIM token now.`}</b>{' '}
                        {c('scim: Info')
                            .t`For security reasons, the SCIM token will be hidden after saving your changes and you won’t be able to see it again.`}
                    </p>
                </div>
            </ModalContent>
            <ModalFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
                <Button type="submit" onClick={onClose} color="norm">
                    {c('Action').t`Done`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default SetupSCIMModal;

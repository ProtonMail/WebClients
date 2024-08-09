import { c } from 'ttag';

import type { ModalProps } from '@proton/components';
import {
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    useDrawer,
} from '@proton/components';
import { DRAWER_PASS_ALIASES_CREATE_ALIAS_MODAL_CTA_ID } from '@proton/components/components/drawer/views/SecurityCenter/constants';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import passIconSvg from '@proton/styles/assets/img/pass/protonpass-icon.svg';

import './ProtonPassAliasesModal.scss';

interface Props extends ModalProps {}

const ProtonPassAliasesModal = ({ ...rest }: Props) => {
    const { toggleDrawerApp, appInView } = useDrawer();
    const openSecurityCenterInDrawer = () => {
        if (appInView === 'security-center') {
            document.getElementById(DRAWER_PASS_ALIASES_CREATE_ALIAS_MODAL_CTA_ID)?.click();
        } else {
            toggleDrawerApp({ app: 'security-center' })();
        }
        rest?.onClose?.();
    };

    return (
        <ModalTwo {...rest} className="pass-aliases-modal">
            <ModalTwoHeader title={c('Title').t`Hide your email with ${PASS_APP_NAME}`} />
            <ModalTwoContent>
                <div className="text-center mb-4">
                    <img src={passIconSvg} width="120" alt="" />
                </div>
                <div>{c('Info')
                    .t`${PASS_APP_NAME} provides a simple way to create logins at untrusted third-party sites where you don't want to expose your actual email address.`}</div>
                <br />
                <div className="mb-2">
                    <strong>{c('Info').t`How hide-my-email aliases works`}</strong>
                </div>
                <ul className="my-0">
                    <li className="mb-4">{c('Info')
                        .t`When giving out your email, use a unique, disposable hide-my-email alias instead of your real email address.`}</li>
                    <li className="mb-4">{c('Info')
                        .t`Email is forwarded to your mailbox; your email address stays hidden.`}</li>
                    <li>{c('Info')
                        .t`If your alias is sold, leaked, or abused, simply disable it to stop receiving spam.`}</li>
                </ul>
            </ModalTwoContent>
            <ModalTwoFooter>
                <PrimaryButton onClick={openSecurityCenterInDrawer} className="ml-auto">
                    {appInView === 'security-center' ? c('Action').t`Create alias` : c('Action').t`Hide my email`}
                </PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ProtonPassAliasesModal;

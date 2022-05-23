import { c } from 'ttag';
import {
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    useUser,
} from '@proton/components';
import connectSimpleLoginSvg from '@proton/styles/assets/img/illustrations/connect-simple-login.svg';
import { useEffect } from 'react';

interface Props extends ModalProps {}
const SimpleLoginModal = ({ ...rest }: Props) => {
    const [{ isFree }] = useUser();

    const hasExtensionInstalled = false;

    const installAndGoText = isFree
        ? c('Info')
              .t`As a Proton Free user, you get 15 free aliases, and your SimpleLogin account will be created automatically when you install the browser plugin.`
        : c('Info')
              .t`As a Proton customer, you get unlimited aliases and mailboxes, and your SimpleLogin account will be created automatically when you install the browser plugin.`;

    const handleExtensionSLEvents = (event: any) => {
        if (event.data.tag === 'EXTENSION_INSTALLED_QUERY' || event.data.tag === 'EXTENSION_INSTALLED_RESPONSE') {
            console.log('received events', { event });
        }
    };

    const handlePluginAction = () => {};

    useEffect(() => {
        // Event listener responsible for catching the extension response
        window.addEventListener('message', handleExtensionSLEvents);

        setTimeout(() => {
            console.log('SEND MESSAGE');
            // post a message to the extension to know whether it's installed
            window.postMessage({ tag: 'EXTENSION_INSTALLED_QUERY' }, '*');
        }, 2000);

        return () => {
            window.removeEventListener('message', handleExtensionSLEvents);
        };
    }, []);

    return (
        <ModalTwo size="large" {...rest}>
            <ModalTwoHeader title={c('Title').t`Take control of your identity and inbox`} />
            <ModalTwoContent>
                <div className="text-center">
                    <img src={connectSimpleLoginSvg} alt={c('Alternative text for SimpleLogin image').t`SimpleLogin`} />
                </div>
                <div>{c('Info')
                    .t`Get free [NAMETBC] aliases from SimpleLogin by Proton, an email masking service that protects your online identity and puts you in control of your inbox.`}</div>
                <br />
                <div className="mb0-5">
                    <strong>{c('Info').t`How it works`}</strong>
                </div>
                <ul className="mt0 mb0">
                    <li className="mb1">{c('Info')
                        .t`When shopping or signing up online, use a unique, instantly generated [NAMETBC] alias instead of your real email address.`}</li>
                    <li className="mb1">{c('Info')
                        .t`Email is forwarded to your mailbox; your email address stays hidden.`}</li>
                    <li>{c('Info')
                        .t`Disable the alias to stop receiving newsletters or in case the mailing list is sold or leaked.`}</li>
                </ul>
                <br />
                <div className="mb0-5">
                    <strong>{c('Info').t`Simply install and go`}</strong>
                </div>
                <div>{installAndGoText}</div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <PrimaryButton onClick={handlePluginAction} className="mlauto">
                    {hasExtensionInstalled
                        ? c('Action').t`Open SimpleLogin plugin`
                        : c('Action').t`Install SimpleLogin plugin`}
                </PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default SimpleLoginModal;

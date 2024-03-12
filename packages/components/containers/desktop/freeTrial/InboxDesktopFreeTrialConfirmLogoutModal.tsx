import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Info, Prompt } from '@proton/components/components';

interface Props {
    onSignOut: (clearData: boolean) => void;
    onClose?: () => void;
}

const InboxDesktopFreeTrialConfirmLogoutModal = ({ onSignOut, onClose, ...rest }: Props) => {
    return (
        <Prompt
            title={c('Title').t`Cancel trial?`}
            buttons={[
                <Button
                    color="norm"
                    onClick={() => {
                        onSignOut(false);
                        onClose?.();
                    }}
                >
                    {c('Action').t`Sign out and cancel trial`}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Keep me signed in`}</Button>,
            ]}
            {...rest}
        >
            <p className="mt-0">
                {c('Info')
                    .t`Signing out will cancel your free desktop app trial. You won't be able to sign into the desktop app again unless you upgrade.`}
                <Info title={c('Info').t`Your inbox will always remain accessible on the web.`} className="ml-1" />
            </p>
        </Prompt>
    );
};

export default InboxDesktopFreeTrialConfirmLogoutModal;

import { c } from 'ttag';

import { Icon } from '@proton/components';

import './WalletNotFoundErrorDropdown.scss';

interface Props {
    email: string;
    hasSentInvite: boolean;
    onSendInvite: (email: string) => void;
}

export const WalletNotFoundError = ({ email, hasSentInvite, onSendInvite }: Props) => {
    return (
        <button
            onClick={() => {
                if (!hasSentInvite) {
                    onSendInvite(email);
                }
            }}
            className="ml-1 items-center flex-nowrap flex flex-row color-primary shrink-0"
        >
            <div className="shrink-0 flex items-center px-2">
                {hasSentInvite ? (
                    <>
                        <span className="block shrink-0 mr-1">{c('Bitcoin send').t`Invitation sent`}</span>
                        <Icon name="paper-plane" />
                    </>
                ) : (
                    <>
                        <Icon name="exclamation-circle" />
                        <span className="block shrink-0 ml-1">{c('Bitcoin send').t`No wallet found`}</span>
                    </>
                )}
            </div>
        </button>
    );
};

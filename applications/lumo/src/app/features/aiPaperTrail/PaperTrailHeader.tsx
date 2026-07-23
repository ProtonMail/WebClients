import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { GuestChatDisclaimerModal } from '../../components/Guest/GuestChatDisclaimerModal';
import { useGuestChatHandler } from '../../hooks/useGuestChatHandler';
import { PaperTrailLogo } from './PaperTrailLogo';

interface Props {
    onStartChat: () => void;
}

export const PaperTrailHeader = ({ onStartChat }: Props) => {
    const { isGuest, handleGuestClick, handleDisclaimerClose, disclaimerModalProps } = useGuestChatHandler();

    const onLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (isGuest) {
            e.preventDefault();
            handleGuestClick();
        }
    };

    return (
        <>
            <header className="ai-paper-trail__header">
                <Link
                    to="/"
                    onClick={onLogoClick}
                    aria-label={`Go to ${LUMO_SHORT_APP_NAME} homepage`}
                    className="ai-paper-trail__header-logo"
                >
                    <PaperTrailLogo height="20px" />
                </Link>
                <Button color="norm" pill onClick={onStartChat}>
                    {c('collider_2025:Action').t`Start a chat`}
                </Button>
            </header>
            {disclaimerModalProps.render && (
                <GuestChatDisclaimerModal onClick={handleDisclaimerClose} {...disclaimerModalProps.modalProps} />
            )}
        </>
    );
};

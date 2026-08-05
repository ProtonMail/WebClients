import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { GuestChatDisclaimerModal } from '../../components/Guest/GuestChatDisclaimerModal';
import { getPaperTrailExitPath, isStandalonePaperTrailPath } from '../../entrypoint/lumoRoutes';
import { useGuestChatHandler } from '../../hooks/useGuestChatHandler';
import { PaperTrailLogo } from './PaperTrailLogo';

interface Props {
    onStartChat: () => void;
}

export const PaperTrailHeader = ({ onStartChat }: Props) => {
    const { isGuest, handleGuestClick, handleDisclaimerClose, disclaimerModalProps } = useGuestChatHandler();
    const exitPath = getPaperTrailExitPath();
    const isStandalone = isStandalonePaperTrailPath(window.location.pathname);

    const onLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (isGuest) {
            e.preventDefault();
            handleGuestClick();
        }
    };

    const logo = <PaperTrailLogo height="20px" />;
    const logoLinkLabel = `Go to ${LUMO_SHORT_APP_NAME} homepage`;

    return (
        <>
            <header className="ai-paper-trail__header">
                {isStandalone ? (
                    <a href={exitPath} aria-label={logoLinkLabel} className="ai-paper-trail__header-logo">
                        {logo}
                    </a>
                ) : (
                    <Link
                        to={exitPath}
                        onClick={onLogoClick}
                        aria-label={logoLinkLabel}
                        className="ai-paper-trail__header-logo"
                    >
                        {logo}
                    </Link>
                )}
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

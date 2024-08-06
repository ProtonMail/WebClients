import { Button } from '@proton/atoms/Button';
import { SettingsLink } from '@proton/components/components/link';
import { APPS } from '@proton/shared/lib/constants';

import { TipActionType } from 'proton-mail/models/tip';

import useTipConfig from './useTipConfig';

interface Props {
    actionType: TipActionType;
    settingsUrl?: string;
    ctaText: string;
    setIsTipDismissed?: (value: boolean) => void;
}

const ProtonTipCTA = ({ actionType, settingsUrl, ctaText }: Props) => {
    const { onClick, modalContent, redirectToSettings, loadingProtonDomains } = useTipConfig({ actionType });

    if (redirectToSettings && settingsUrl) {
        return (
            <SettingsLink path={settingsUrl} className="link align-baseline" app={APPS.PROTONMAIL}>
                {ctaText}
            </SettingsLink>
        );
    }

    return (
        <>
            {modalContent}
            <Button
                onClick={onClick}
                disabled={actionType === TipActionType.GetProtonSubdomainAddress && loadingProtonDomains}
                shape="underline"
                size="small"
                className="link align-baseline"
            >
                {ctaText}
            </Button>
        </>
    );
};

export default ProtonTipCTA;

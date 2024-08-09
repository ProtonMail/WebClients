import { Button } from '@proton/atoms/Button';
import { SettingsLink } from '@proton/components/components/link';
import { APPS } from '@proton/shared/lib/constants';

import { TipActionType } from 'proton-mail/models/tip';
import { useMailSelector } from 'proton-mail/store/hooks';
import { selectSnoozeElement } from 'proton-mail/store/snooze/snoozeSliceSelectors';

import useTipConfig from './useTipConfig';

interface Props {
    actionType: TipActionType;
    settingsUrl?: string;
    ctaText: string;
    setIsTipDismissed?: (value: boolean) => void;
}

const ProtonTipCTA = ({ actionType, settingsUrl, ctaText }: Props) => {
    const { onClick, modalContent, redirectToSettings, loadingProtonDomains } = useTipConfig({ actionType });
    const snoozedElement = useMailSelector(selectSnoozeElement);

    if (redirectToSettings && settingsUrl) {
        return (
            <SettingsLink path={settingsUrl} className="link align-baseline" app={APPS.PROTONMAIL}>
                {ctaText}
            </SettingsLink>
        );
    }

    let isDisabled = false;
    if (actionType === TipActionType.GetProtonSubdomainAddress && loadingProtonDomains) {
        isDisabled = true;
        // We don't want to allow to click the button if there is a snooze dropdown open
    } else if (actionType === TipActionType.SnoozeEmail && snoozedElement?.ID) {
        isDisabled = true;
    }

    return (
        <>
            {modalContent}
            <Button
                onClick={onClick}
                disabled={isDisabled}
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

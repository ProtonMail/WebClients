import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { SUBSCRIPTION_STEPS, SettingsLink, useUpsellConfig } from '@proton/components';
import { APP_UPSELL_REF_PATH, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpsellRef } from '@proton/shared/lib/helpers/upsell';

interface OptionProps {
    url: string;
    optionID: number;
    callToActionText?: string;
}

const getUpsellLink = (optionID: number) => {
    const upsellPath = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.BANNER,
        feature: optionID.toString(),
    });
    return upsellPath;
};

const MailUpsellOptionCTA = ({ url, optionID, callToActionText }: OptionProps) => {
    const upsellRef = getUpsellLink(optionID);
    const upsellConfig = useUpsellConfig({ upsellRef, step: SUBSCRIPTION_STEPS.PLAN_SELECTION });

    if (upsellConfig.onUpgrade) {
        return (
            <Button
                onClick={upsellConfig.onUpgrade}
                shape="underline"
                size="small"
                className="text-bold link align-baseline py-0"
            >
                {c('Action').t`Upgrade` ?? callToActionText}
            </Button>
        );
    }

    return (
        <SettingsLink path={addUpsellPath(url, upsellRef)} className="text-bold link align-baseline" tabIndex={0}>
            {c('Action').t`Upgrade` ?? callToActionText}
        </SettingsLink>
    );
};

export default MailUpsellOptionCTA;

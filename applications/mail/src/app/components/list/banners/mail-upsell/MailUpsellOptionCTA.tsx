import { type ReactElement, cloneElement } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import {
    PmMeUpsellModal,
    SUBSCRIPTION_STEPS,
    SettingsLink,
    useModalStateObject,
    useUpsellConfig,
} from '@proton/components';
import {
    APP_UPSELL_REF_PATH,
    MAIL_UPSELL_BANNER_LINK_ID_REF_PATH,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { addUpsellPath, getUpsellRef } from '@proton/shared/lib/helpers/upsell';

interface OptionProps {
    url: string;
    optionID: MAIL_UPSELL_BANNER_LINK_ID_REF_PATH;
}

const getUpsellLink = (optionID: MAIL_UPSELL_BANNER_LINK_ID_REF_PATH) => {
    const upsellRefOptions = {
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.BANNER,
        feature: optionID,
    };
    const upsellRef = getUpsellRef(upsellRefOptions);
    return { upsellRef, upsellRefOptions };
};

const MailUpsellModal = ({ optionID, children }: { children: ReactElement; optionID: OptionProps['optionID'] }) => {
    const modal = useModalStateObject();

    if (optionID === MAIL_UPSELL_BANNER_LINK_ID_REF_PATH.SEND_FROM_PM_ADDRESS) {
        return (
            <>
                {modal.render && (
                    <PmMeUpsellModal
                        modalProps={modal.modalProps}
                        upsellRefOptions={getUpsellLink(optionID).upsellRefOptions}
                    />
                )}
                {cloneElement(children, {
                    ...children.props,
                    onClick: () => modal.openModal(true),
                })}
            </>
        );
    }

    return children;
};

const MailUpsellOptionCTA = ({ url, optionID }: OptionProps) => {
    const { upsellRef } = getUpsellLink(optionID);
    const upsellConfig = useUpsellConfig({
        upsellRef,
        step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
    });

    if (upsellConfig.onUpgrade) {
        return (
            <MailUpsellModal optionID={optionID}>
                <Button
                    onClick={upsellConfig.onUpgrade}
                    shape="underline"
                    size="small"
                    className="text-bold link align-baseline py-0"
                >
                    {c('Action').t`Upgrade`}
                </Button>
            </MailUpsellModal>
        );
    }

    return (
        <SettingsLink path={addUpsellPath(url, upsellRef)} className="text-bold link align-baseline" tabIndex={0}>
            {c('Action').t`Upgrade`}
        </SettingsLink>
    );
};

export default MailUpsellOptionCTA;

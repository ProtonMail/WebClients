import React from 'react';

import { c, msgid } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { type ModalStateProps, SettingsLink, UpsellModal } from '@proton/components';
import useConfig from '@proton/components/hooks/useConfig';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { MAIL_APP_NAME, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import forwardImg from '@proton/styles/assets/img/illustrations/new-upsells-img/easy-switch-forward.svg';

import { MAX_SYNC_FREE_USER, MAX_SYNC_PAID_USER } from '../../../constants';
import useBYOEAddressesCounts from '../../../hooks/useBYOEAddressesCounts';

interface Props {
    modalProps: ModalStateProps;
}

const UpsellConversionModal = ({ modalProps }: Props) => {
    const { APP_NAME } = useConfig();
    const planName = PLAN_NAMES[PLANS.MAIL];

    const { addressesOrSyncs } = useBYOEAddressesCounts();

    const numAddressesOrSync = addressesOrSyncs.length;

    const upsellRef =
        getUpsellRefFromApp({
            app: APP_NAME,
            feature: SHARED_UPSELL_PATHS.EASY_SWITCH_BYOE,
            component: UPSELL_COMPONENT.MODAL,
            fromApp: getAppFromPathnameSafe(window.location.pathname),
        }) || '';

    return (
        <UpsellModal
            upsellRef={upsellRef}
            title={c('Title').t`Connect a Gmail address`}
            description={
                <>
                    <span>
                        {/*translator: full sentence is "You're forwarding X Gmail address to Proton Mail."*/}
                        {c('loc_nightly: BYOE').ngettext(
                            msgid`You're forwarding ${numAddressesOrSync} Gmail address to ${MAIL_APP_NAME}.`,
                            `You're forwarding ${numAddressesOrSync} Gmail address to ${MAIL_APP_NAME}.`,
                            numAddressesOrSync
                        )}
                    </span>
                    <span className="ml-1">
                        {/*translator: full sentence is "Your plan supports 1 Gmail address."*/}
                        {c('loc_nightly: BYOE').ngettext(
                            msgid`Your plan supports ${MAX_SYNC_FREE_USER} Gmail address.`,
                            `Your plan supports ${MAX_SYNC_FREE_USER} Gmail addresses.`,
                            MAX_SYNC_FREE_USER
                        )}
                    </span>
                    <span className="ml-1">
                        {/*translator: full sentence is "To connect more, upgrade to Mail Plus and get up to 3 Gmail accounts linked to your inbox."*/}
                        {c('loc_nightly: BYOE').ngettext(
                            msgid`To connect up to ${MAX_SYNC_PAID_USER} Gmail address, upgrade to ${planName}.`,
                            `To connect up to ${MAX_SYNC_PAID_USER} Gmail addresses, upgrade to ${planName}.`,
                            MAX_SYNC_PAID_USER
                        )}
                    </span>
                </>
            }
            customDescription={
                <ButtonLike as={SettingsLink} shape="underline" path="/easy-switch" className="color-weak">
                    {c('loc_nightly: BYOE').t`Or remove forwarding address`}
                </ButtonLike>
            }
            customDescriptionClassname="my-2"
            modalProps={modalProps}
            illustration={forwardImg}
        />
    );
};

export default UpsellConversionModal;

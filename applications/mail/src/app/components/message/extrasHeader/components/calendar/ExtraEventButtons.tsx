import type { Dispatch, SetStateAction } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import BYOEClaimProtonAddressModal from '@proton/activation/src/components/Modals/BYOEClaimProtonAddressModal/BYOEClaimProtonAddressModal';
import { InlineLinkButton } from '@proton/atoms';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { APPS, BRAND_NAME, CALENDAR_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';
import type { RequireSome } from '@proton/shared/lib/interfaces/utils';

import type { InvitationModel } from '../../../../../helpers/calendar/invite';
import { getDoNotDisplayButtons } from '../../../../../helpers/calendar/invite';
import { getCalendarEventLink } from '../../../../../helpers/calendar/inviteLink';
import ExtraEventAlert from './ExtraEventAlert';
import ExtraEventAttendeeButtons from './ExtraEventAttendeeButtons';
import ExtraEventImportButton from './ExtraEventImportButton';
import ExtraEventOrganizerButtons from './ExtraEventOrganizerButtons';

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    setModel: Dispatch<SetStateAction<InvitationModel>>;
    message: MessageState;
    reloadWidget: () => void;
}

const ExtraEventButtons = ({ model, setModel, message, reloadWidget }: Props) => {
    const [addresses] = useAddresses();
    const inviteButtons = model.isOrganizerMode ? (
        <ExtraEventOrganizerButtons model={model} setModel={setModel} />
    ) : (
        <ExtraEventAttendeeButtons model={model} setModel={setModel} message={message} reloadWidget={reloadWidget} />
    );
    const importButton = <ExtraEventImportButton model={model} setModel={setModel} />;
    const buttons = model.isImport ? importButton : inviteButtons;
    const displayButtons = getDoNotDisplayButtons(model) ? null : buttons;

    const isPartyCrasherNonBlocking = model.isPartyCrasher && !model.hasProtonUID;
    const showClaimProtonAddressButton = isPartyCrasherNonBlocking || !model.isPartyCrasher;

    const [claimProtonAddressModalProps, setClaimProtonAddressModalProps, renderClaimProtonAddressModal] =
        useModalState();

    const link = getCalendarEventLink(model);

    return (
        <>
            {link && !getIsBYOEOnlyAccount(addresses) && <div className="mb-2">{link}</div>}
            <ExtraEventAlert model={model} />
            {!getIsBYOEOnlyAccount(addresses) ? (
                displayButtons
            ) : showClaimProtonAddressButton ? (
                <InlineLinkButton
                    onClick={() => setClaimProtonAddressModalProps(true)}
                    data-testid="calendar-widget-claim-address-button"
                >{c('Action').t`Claim your free ${BRAND_NAME} address`}</InlineLinkButton>
            ) : null}

            {renderClaimProtonAddressModal && (
                <BYOEClaimProtonAddressModal
                    toApp={APPS.PROTONMAIL}
                    title={c('Title').t`Get full access to ${CALENDAR_APP_NAME}`}
                    description={c('Info')
                        .t`${CALENDAR_APP_NAME} requires a ${BRAND_NAME} address for secure event sync and encryption. Claim your free ${MAIL_APP_NAME} address now.`}
                    {...claimProtonAddressModalProps}
                />
            )}
        </>
    );
};

export default ExtraEventButtons;

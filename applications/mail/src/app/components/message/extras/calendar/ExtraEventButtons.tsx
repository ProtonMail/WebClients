import { Dispatch, SetStateAction } from 'react';

import { RequireSome } from '@proton/shared/lib/interfaces/utils';

import { InvitationModel, getDoNotDisplayButtons } from '../../../../helpers/calendar/invite';
import { getCalendarEventLink } from '../../../../helpers/calendar/inviteLink';
import { MessageState } from '../../../../logic/messages/messagesTypes';
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
    const { isImport, isOrganizerMode } = model;
    const inviteButtons = isOrganizerMode ? (
        <ExtraEventOrganizerButtons model={model} setModel={setModel} />
    ) : (
        <ExtraEventAttendeeButtons model={model} setModel={setModel} message={message} reloadWidget={reloadWidget} />
    );
    const importButton = <ExtraEventImportButton model={model} setModel={setModel} />;
    const buttons = isImport ? importButton : inviteButtons;
    const displayButtons = getDoNotDisplayButtons(model) ? null : buttons;

    const link = getCalendarEventLink(model);

    return (
        <>
            {link && <div className="mb0-5">{link}</div>}
            <ExtraEventAlert model={model} />
            {displayButtons}
        </>
    );
};

export default ExtraEventButtons;

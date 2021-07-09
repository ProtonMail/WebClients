import { RequireSome } from '@proton/shared/lib/interfaces/utils';
import React, { Dispatch, SetStateAction } from 'react';
import { classnames } from '@proton/components';
import { getCalendarEventLink, getDoNotDisplayButtons, InvitationModel } from '../../../../helpers/calendar/invite';
import { MessageExtended } from '../../../../models/message';
import ExtraEventAlert from './ExtraEventAlert';
import ExtraEventAttendeeButtons from './ExtraEventAttendeeButtons';
import ExtraEventImportButton from './ExtraEventImportButton';
import ExtraEventLink from './ExtraEventLink';
import ExtraEventOrganizerButtons from './ExtraEventOrganizerButtons';

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    setModel: Dispatch<SetStateAction<InvitationModel>>;
    message: MessageExtended;
}
const ExtraEventButtons = ({ model, setModel, message }: Props) => {
    const { isImport, hasMultipleVevents, isOrganizerMode } = model;
    const inviteButtons = isOrganizerMode ? (
        <ExtraEventOrganizerButtons model={model} />
    ) : (
        <ExtraEventAttendeeButtons model={model} setModel={setModel} message={message} />
    );
    const importButton = <ExtraEventImportButton model={model} setModel={setModel} />;
    const buttons = isImport ? importButton : inviteButtons;
    const displayButtons = getDoNotDisplayButtons(model) ? null : buttons;
    const { to, toApp, text } = getCalendarEventLink(model);
    // Event details are not displayed for import mode with multiple events
    const displayBorderBottom = isImport && hasMultipleVevents ? false : !!text || !!displayButtons;

    return (
        <div className={classnames(['pt0-5 mt0-5 mb0-5 border-top', displayBorderBottom && 'border-bottom'])}>
            {displayButtons}
            <ExtraEventAlert model={model} />
            <ExtraEventLink to={to} text={text} toApp={toApp} />
        </div>
    );
};

export default ExtraEventButtons;

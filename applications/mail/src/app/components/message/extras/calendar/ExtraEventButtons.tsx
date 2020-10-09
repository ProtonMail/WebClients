import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import React, { Dispatch, SetStateAction } from 'react';
import { classnames } from 'react-components';
import { getCalendarEventLink, getDoNotDisplayButtons, InvitationModel } from '../../../../helpers/calendar/invite';
import { MessageExtended } from '../../../../models/message';
import ExtraEventAlert from './ExtraEventAlert';
import ExtraEventAttendeeButtons from './ExtraEventAttendeeButtons';
import ExtraEventLink from './ExtraEventLink';
import ExtraEventOrganizerButtons from './ExtraEventOrganizerButtons';

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    setModel: Dispatch<SetStateAction<InvitationModel>>;
    message: MessageExtended;
}
const ExtraEventButtons = ({ model, setModel, message }: Props) => {
    const { isOrganizerMode } = model;
    const buttons = getDoNotDisplayButtons(model) ? null : isOrganizerMode ? (
        <ExtraEventOrganizerButtons model={model} />
    ) : (
        <ExtraEventAttendeeButtons model={model} setModel={setModel} message={message} />
    );
    const { to, text } = getCalendarEventLink(model);
    const displayBorderBottom = to !== undefined || !!buttons;

    return (
        <div className={classnames(['pt0-5 mt0-5 mb0-5 border-top', displayBorderBottom && 'border-bottom'])}>
            {buttons}
            <ExtraEventAlert model={model} />
            <ExtraEventLink to={to} text={text} />
        </div>
    );
};

export default ExtraEventButtons;

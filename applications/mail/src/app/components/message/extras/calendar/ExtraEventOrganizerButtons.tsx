import { Dispatch, SetStateAction } from 'react';

import { ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { RequireSome } from '@proton/shared/lib/interfaces/utils';

import { InvitationModel, getHasInvitationApi } from '../../../../helpers/calendar/invite';
import ExtraEventAddParticipantButton from './ExtraEventAddParticipantButton';

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    setModel: Dispatch<SetStateAction<InvitationModel>>;
}
const ExtraEventOrganizerButtons = ({ model, setModel }: Props) => {
    const {
        invitationIcs: { method },
        isPartyCrasher,
        singleEditData,
    } = model;

    const hasSingleEdits = singleEditData && singleEditData.length > 0;

    if (!getHasInvitationApi(model)) {
        return null;
    }

    if (method === ICAL_METHOD.REPLY && isPartyCrasher && !hasSingleEdits) {
        return <ExtraEventAddParticipantButton model={model} setModel={setModel} />;
    }

    return null;
};

export default ExtraEventOrganizerButtons;

import type { MutableRefObject } from 'react';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

interface Props {
    shareCalendarInvitationRef: MutableRefObject<{ calendarID: string; invitationID: string } | undefined>;
}

const ShareInvitationContainer = ({ shareCalendarInvitationRef }: Props) => {
    const history = useHistory();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const calendarID = urlParams.get('CalendarID');
        const invitationID = urlParams.get('InvitationID');

        if (calendarID && invitationID) {
            shareCalendarInvitationRef.current = { calendarID, invitationID };
        }
        history.replace('/');
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-001F0A
    }, []);

    return null;
};

export default ShareInvitationContainer;

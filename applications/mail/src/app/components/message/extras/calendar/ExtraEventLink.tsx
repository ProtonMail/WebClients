import { APP_NAMES, APPS } from 'proton-shared/lib/constants';
import React from 'react';
import { AppLink } from 'react-components';

interface Props {
    to?: string;
    text?: string;
    toApp?: APP_NAMES;
}
const ExtraEventLink = ({ to, text, toApp = APPS.PROTONCALENDAR }: Props) => {
    if (to === undefined) {
        return null;
    }
    return (
        <div className="mb0-5">
            <AppLink to={to} toApp={toApp}>
                {text}
            </AppLink>
        </div>
    );
};

export default ExtraEventLink;

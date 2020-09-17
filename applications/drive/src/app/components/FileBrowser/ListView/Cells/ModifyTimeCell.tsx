import React from 'react';
import readableTime from 'proton-shared/lib/helpers/readableTime';
import { dateLocale } from 'proton-shared/lib/i18n';
import { Time } from 'react-components';

interface Props {
    modifyTime: number;
}

const ModifyTimeCell = ({ modifyTime }: Props) => {
    return (
        <div className="ellipsis" title={readableTime(modifyTime, 'PPp', { locale: dateLocale })}>
            <span className="pre">
                <Time key="dateModified" format="PPp">
                    {modifyTime}
                </Time>
            </span>
        </div>
    );
};

export default ModifyTimeCell;

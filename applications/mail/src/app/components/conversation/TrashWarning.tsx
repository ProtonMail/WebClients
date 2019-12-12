import React from 'react';
import { c } from 'ttag';

interface Props {
    inTrash: boolean;
    filter: boolean;
    onToggle: () => void;
}

const TrashWarning = ({ inTrash, filter, onToggle }: Props) => {
    return (
        <div className="containsMessage flex flex-column">
            <p className="bordered-container flex pt0-5 pb0-5 pl1 pr1">
                {inTrash
                    ? c('Info').t`This conversation contains non-trashed messages.`
                    : c('Info').t`This conversation contains trashed messages.`}
                <a onClick={onToggle} className="ml0-5">
                    {inTrash
                        ? filter
                            ? c('Action').t`Show non-trashed messages`
                            : c('Action').t`Hide non-trashed messages`
                        : filter
                        ? c('Action').t`Show trashed messages`
                        : c('Action').t`Hide trashed messages`}
                </a>
            </p>
        </div>
    );
};

export default TrashWarning;

import React from 'react';
import { c } from 'ttag';
import { InlineLinkButton, Icon } from 'react-components';

interface Props {
    inTrash: boolean;
    filter: boolean;
    onToggle: () => void;
}

const TrashWarning = ({ inTrash, filter, onToggle }: Props) => {
    return (
        <div className="bordered-container m0-5 mb1 p1 flex flex-nowrap flex-items-center flex-spacebetween bg-global-highlight">
            <div className="flex flex-nowrap flex-items-center">
                <Icon name="trash" className="mr1" />
                <span>
                    {inTrash
                        ? c('Info').t`This conversation contains non-trashed messages.`
                        : c('Info').t`This conversation contains trashed messages.`}
                </span>
            </div>
            <InlineLinkButton onClick={onToggle} className="ml0-5 underline">
                {inTrash
                    ? filter
                        ? c('Action').t`Show messages`
                        : c('Action').t`Hide messages`
                    : filter
                    ? c('Action').t`Show messages`
                    : c('Action').t`Hide messages`}
            </InlineLinkButton>
        </div>
    );
};

export default TrashWarning;

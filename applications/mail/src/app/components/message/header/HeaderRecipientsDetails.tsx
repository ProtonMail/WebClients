import React from 'react';
import { c } from 'ttag';
import { Message, Recipient } from '../../../models/message';

interface Props {
    message?: Message;
}

interface ListProps {
    list: Recipient[];
}

const RecipientsList = ({ list }: ListProps) => (
    <span className="flex-self-vcenter flex flex-column">
        {list.map(({ Address = '', Name = '' }, index) => {
            return (
                <span key={index}>
                    {Name || Address} <span className="opacity-50">&lt;{Address}&gt;</span>{' '}
                </span>
            );
        })}
    </span>
);

const HeaderRecipientsDetails = ({ message = {} }: Props) => {
    const { ToList = [], CCList = [], BCCList = [] } = message;

    return (
        <div className="flex flex-column">
            {ToList.length > 0 && (
                <span className="flex">
                    <span className="opacity-50 container-to">{c('Label').t`To:`}</span>
                    <span className="flex-self-vcenter mr1">
                        <RecipientsList list={ToList} />
                    </span>
                </span>
            )}
            {CCList.length > 0 && (
                <span className="flex">
                    <span className="opacity-50 container-to">{c('Label').t`CC:`}</span>
                    <span className="flex-self-vcenter mr1">
                        <RecipientsList list={CCList} />
                    </span>
                </span>
            )}
            {BCCList.length > 0 && (
                <span className="flex">
                    <span className="opacity-50 container-to">{c('Label').t`BCC:`}</span>
                    <span className="flex-self-vcenter mr1">
                        <RecipientsList list={BCCList} />
                    </span>
                </span>
            )}
        </div>
    );
};

export default HeaderRecipientsDetails;

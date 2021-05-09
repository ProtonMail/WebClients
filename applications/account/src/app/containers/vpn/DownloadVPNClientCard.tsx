import React from 'react';
import { c } from 'ttag';
import { Bordered, Icon, Href, ButtonLike } from 'react-components';

interface Props {
    title?: string;
    link?: string;
    icon: string;
}

const DownloadVPNClientCard = ({ title, link, icon }: Props) => {
    return (
        <Bordered className="rounded1e bg-white flex flex-column flex-align-items-center p2 mt1 mr1">
            <div>
                <Icon size={60} name={icon} />
            </div>
            <p className="text-bold">{title}</p>
            <ButtonLike as={Href} url={link} className="pl3 pr3">
                {c('Action').t`Download`}
                <span className="sr-only">{title}</span>
            </ButtonLike>
        </Bordered>
    );
};
export default DownloadVPNClientCard;

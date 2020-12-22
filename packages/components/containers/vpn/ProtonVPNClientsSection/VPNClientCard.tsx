import React from 'react';
import { c } from 'ttag';
import { Bordered, Icon, Block, Href } from '../../../components';

interface Props {
    title: string;
    link: string;
    icon: string;
}

const VPNClientCard = ({ title, link, icon }: Props) => {
    return (
        <Bordered className="mr1 aligncenter relative">
            <div>
                <Icon size={24} name={icon} />
            </div>
            <Block>{title}</Block>
            <Href url={link} className="pm-button increase-surface-click">
                {c('Action').t`Download`}
                <span className="sr-only">{title}</span>
            </Href>
        </Bordered>
    );
};

export default VPNClientCard;

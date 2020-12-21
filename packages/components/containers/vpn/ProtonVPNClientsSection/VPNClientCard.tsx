import React from 'react';
import { c } from 'ttag';
import { Bordered, Icon, Block, Href, Info } from '../../../components';

interface Props {
    title: string;
    link: string;
    icon: string;
    tooltip?: string;
}

const VPNClientCard = ({ title, link, icon, tooltip }: Props) => {
    return (
        <Bordered className="mr1 aligncenter relative">
            <div>
                <Icon size={24} name={icon} />
            </div>
            <div className="flex flex-justify-center">
                <Block>{title}</Block>
                {tooltip ? <Info buttonClass="ml0-25 mb1 relative z667" title={tooltip} /> : null}
            </div>
            <Href url={link} className="pm-button increase-surface-click">
                {c('Action').t`Download`}
                <span className="sr-only">{title}</span>
            </Href>
        </Bordered>
    );
};

export default VPNClientCard;

import React from 'react';
import { c } from 'ttag';
import { Bordered, Icon, Block, Href, SimpleDropdown, DropdownMenu, Group } from '../../../components';

interface Props {
    title: string;
    link: string;
    icon: string;
    items?: React.ReactNode[];
}
const VPNClientCard = ({ title, link, items, icon }: Props) => {
    return (
        <Bordered className="mr1 text-center relative">
            <div>
                <Icon size={24} name={icon} />
            </div>
            <Block>{title}</Block>
            {!items ? (
                <div className="pl1-25 pr1-25 flex mt1 flex-justify-center">
                    <Href url={link} className="button">
                        {c('Action').t`Download`}
                        <span className="sr-only">{title}</span>
                    </Href>
                </div>
            ) : (
                <Group className="flex mt1 flex-justify-center">
                    <Href url={link} className="button grouped-button">
                        {c('Action').t`Download`}
                        <span className="sr-only">{title}</span>
                    </Href>
                    <SimpleDropdown
                        originalPlacement="bottom-right"
                        className="button grouped-button button--for-icon"
                        title={c('Title').t`Open actions dropdown`}
                        content=""
                    >
                        <DropdownMenu>{items}</DropdownMenu>
                    </SimpleDropdown>
                </Group>
            )}
        </Bordered>
    );
};
export default VPNClientCard;

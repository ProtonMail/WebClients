import React from 'react';
import { c } from 'ttag';
import {
    Bordered,
    Icon,
    Block,
    Href,
    SimpleDropdown,
    DropdownMenu,
    ButtonGroup,
    ButtonLike,
    Button,
} from '../../../components';

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
                    <ButtonLike as={Href} url={link}>
                        {c('Action').t`Download`}
                        <span className="sr-only">{title}</span>
                    </ButtonLike>
                </div>
            ) : (
                <ButtonGroup className="flex mt1 flex-justify-center">
                    <ButtonLike as={Href} url={link}>
                        {c('Action').t`Download`}
                        <span className="sr-only">{title}</span>
                    </ButtonLike>
                    <SimpleDropdown
                        icon
                        as={Button}
                        originalPlacement="bottom-right"
                        title={c('Title').t`Open actions dropdown`}
                    >
                        <DropdownMenu>{items}</DropdownMenu>
                    </SimpleDropdown>
                </ButtonGroup>
            )}
        </Bordered>
    );
};
export default VPNClientCard;

import * as React from 'react';
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
        <Bordered className="rounded-bigger flex flex-column flex-align-items-center pt2 pb2 pl3 pr3 mt1 mr1">
            <div>
                <Icon size={60} name={icon} />
            </div>
            <Block>{title}</Block>
            {!items ? (
                <div className="pl1 pr1 flex mt1 flex-justify-center">
                    <ButtonLike as={Href} url={link}>
                        {c('Action').t`Download`}
                        <span className="sr-only">{title}</span>
                    </ButtonLike>
                </div>
            ) : (
                <ButtonGroup className="flex pl0-25 pr0-25 mt1 flex-justify-center">
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

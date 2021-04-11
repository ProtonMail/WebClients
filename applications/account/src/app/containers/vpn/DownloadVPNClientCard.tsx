import React from 'react';
import { c } from 'ttag';
import { Bordered, Icon, Href, ButtonLike, Card } from 'react-components';

interface Props {
    title?: string;
    link?: string;
    icon: string;
    textExample?: any;
}

const DownloadVPNClientCard = ({ title, link, icon, textExample }: Props) => {
    return (
        <>
            {textExample ? (
                <Card className="rounded1e bg-white flex flex-column mt1 mr1 mb1 p2">
                    <div className="flex flex-nowrap mb1">
                        <Icon size={16} name={icon} />
                        <p className="mt0 mb0 ml1">
                            This is upgrade text <br /> example
                        </p>
                    </div>
                    <div className="flex flex-nowrap">
                        <Icon size={16} name="upgrade-to-paid" />
                        <p className="mt0 ml1">
                            This is upgrade text <br /> example
                        </p>
                    </div>

                    <ButtonLike as={Href} url={link} className="pl3 pr3" fullWidth>
                        {c('Action').t`Upgrade`}
                        <span className="sr-only">{title}</span>
                    </ButtonLike>
                </Card>
            ) : (
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
            )}
        </>
    );
};
export default DownloadVPNClientCard;

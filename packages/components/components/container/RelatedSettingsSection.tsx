import React from 'react';
import { Link } from 'react-router-dom';
import Information from './Information';
import Paragraph from '../paragraph/Paragraph';

interface BlockListItem {
    icon: string;
    text: string;
    to?: string;
    link: string | React.ReactElement;
}

interface Props {
    list: BlockListItem[];
}

const RelatedSettingsSection = ({ list = [] }: Props) => {
    if (list.length > 2) {
        throw new Error('You can only display 2 blocks in RelatedSettingsSection');
    }
    return (
        <div className="flex flex-justify-space-between on-tablet-flex-column">
            {list.map(({ icon, text, to = '/', link }, index) => (
                <div key={index.toString()} className="w45 flex on-tablet-mb1">
                    <Information icon={icon}>
                        <Paragraph>{text}</Paragraph>
                        <Paragraph className="text-center mtauto">
                            {typeof link === 'string' ? (
                                <Link className="button button--primary" to={to}>
                                    {link}
                                </Link>
                            ) : (
                                link
                            )}
                        </Paragraph>
                    </Information>
                </div>
            ))}
        </div>
    );
};

export default RelatedSettingsSection;

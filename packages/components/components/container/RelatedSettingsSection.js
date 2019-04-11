import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SubTitle, Information, Paragraph } from 'react-components';
import { Link } from 'react-router-dom';

const RelatedSettingsSection = ({ list }) => {
    if (list.length > 2) {
        throw new Error('You can only display 2 blocks in RelatedSettingsSection');
    }
    return (
        <>
            <SubTitle>{c('Title').t`Related settings`}</SubTitle>
            <div className="flex flex-spacebetween">
                {list.map(({ icon, text, to, link }, index) => {
                    return (
                        <div key={index.toString()} className="w45">
                            <Information icon={icon}>
                                <Paragraph>{text}</Paragraph>
                                <Paragraph className="aligncenter">
                                    <Link className="pm-button pm-button--primary" to={to}>
                                        {link}
                                    </Link>
                                </Paragraph>
                            </Information>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

RelatedSettingsSection.propTypes = {
    list: PropTypes.array.isRequired
};

RelatedSettingsSection.defaultProps = {
    list: [] // [{ icon, text, to, link }]
};

export default RelatedSettingsSection;

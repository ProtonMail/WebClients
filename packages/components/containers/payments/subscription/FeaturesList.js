import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { useUser, useOrganization, Href } from 'react-components';
import { Link } from 'react-router-dom';

const FeaturesList = () => {
    const [{ hasPaidMail } = {}] = useUser();
    const [{ MaxMembers } = {}] = useOrganization();
    const features = [
        ...(hasPaidMail
            ? [
                  { to: '/settings/auto-reply', text: c('Link').t`Add auto-reply` },
                  { to: '/settings/domains', text: c('Link').t`Add custom domain` },
                  { to: '/settings/filters', text: c('Link').t`Add filters` },
                  { to: '/contacts', text: c('Link').t`Manage encrypted contacts`, internal: true }
              ]
            : []),
        ...(MaxMembers > 1 ? [{ to: '/settings/members', text: c('Link').t`Add new users` }] : []),
        { to: 'https://protonvpn.com/download/', text: c('Link').t`Use ProtonVPN`, external: true }
    ];
    features.push();
    return (
        <ul className="unstyled">
            {features.map(({ to, text, external, internal }, index) => {
                if (external || internal) {
                    return (
                        <li key={index.toString()}>
                            <Href href={to} target={external ? '_blank' : '_self'}>
                                {text}
                            </Href>
                        </li>
                    );
                }
                return (
                    <li key={index.toString()}>
                        <Link to={to}>{text}</Link>
                    </li>
                );
            })}
        </ul>
    );
};

FeaturesList.propTypes = {
    model: PropTypes.object
};

export default FeaturesList;

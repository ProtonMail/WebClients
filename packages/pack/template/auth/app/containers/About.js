import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SubTitle, Title, Bordered, PrimaryButton, Icon } from 'react-components';

function About() {
    return (
        <div className="p1">
            <Bordered className="m1">
                <Title>{c('Context').t`Pour la petite histoire`}</Title>
                <SubTitle>Il était une fois...</SubTitle>

                <p className="p1">
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore
                    et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                    aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
                    cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                    culpa qui officia deserunt mollit anim id est laborum.
                </p>

                <Bordered className="m1">
                    <PrimaryButton>
                        <Icon name="folder" className="icon-16p mr1" /> Click me
                    </PrimaryButton>
                </Bordered>

                <div className="flex flex-spacebetween">
                    <img
                        src="https://protonmail.com/blog/wp-content/uploads/2018/12/protonmail-email-security-best-practices-768x384.jpg"
                        className="bordered-container p0-5"
                        style={{ maxHeight: 200 }}
                    />
                    <img
                        src="https://protonmail.com/blog/wp-content/uploads/2018/12/protonmail-email-security-best-practices-768x384.jpg"
                        className="bordered-container p0-5"
                        style={{ transform: 'scaleX(-1)', maxHeight: 200 }}
                    />
                </div>
            </Bordered>
        </div>
    );
}

export default About;

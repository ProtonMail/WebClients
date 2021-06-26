import React from 'react';
import { c } from 'ttag';
import { Title, SubTitle, Bordered, PrimaryButton, Icon, Icons } from 'react-components';

export default () => {
    return (
        <>
            <header className="header flex flex-nowrap flex-spacebetween reset4print">
                <Title>Proton boilerplate</Title>
            </header>
            <div className="flex-item-fluid main-area App body mod--hidden">
                <Bordered className="m1">
                    <Title>{c('Context').t`Pour la petite histoire`}</Title>
                    <SubTitle>Il était une fois...</SubTitle>

                    <p className="p1">
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut
                        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
                        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
                        non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>

                    <Bordered className="m1">
                        <PrimaryButton>
                            <Icon name="folder" className="icon-16p mr1" /> Click me
                        </PrimaryButton>
                    </Bordered>

                    <div className="flex flex-spacebetween">
                        <img src="https://i.imgur.com/R3TmATS.jpg" className="bordered-container p0-5" />
                        <img
                            src="https://i.imgur.com/R3TmATS.jpg"
                            className="bordered-container p0-5"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                    </div>

                    <p className="p1">
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut
                        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
                        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
                        non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                </Bordered>
                <Icons />
            </div>
        </>
    );
};

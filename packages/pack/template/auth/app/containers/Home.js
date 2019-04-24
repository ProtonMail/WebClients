import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { useUser } from 'react-components';

function Home() {
    const [user] = useUser();

    return (
        <div className="p1">
            <h1>Welcome {user.Name}</h1>
            <p>
                Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
                ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
                fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
                deserunt mollit anim id est laborum.
            </p>
        </div>
    );
}

export default Home;

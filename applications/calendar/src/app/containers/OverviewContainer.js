import React from 'react';
import { useUser } from 'react-components';

import Main from '../components/Main';

const OverviewContainer = () => {
    const [user] = useUser();

    return <Main>Hello {user.Name}</Main>;
};

export default OverviewContainer;

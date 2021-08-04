import PropTypes from 'prop-types';
import { Icons } from '@proton/components';

const PublicLayout = ({ children }) => {
    return (
        <>
            <main className="main-full flex flex-column flex-nowrap reset4print">{children}</main>
            <Icons />
        </>
    );
};

PublicLayout.propTypes = {
    children: PropTypes.node.isRequired,
};

export default PublicLayout;

import React from 'react';
import PropTypes from 'prop-types';

const NotificationsContainer = ({ notifications, remove }) => {
    const list = notifications.map(({ id, type, text }) => {
        return (
            <div onClick={() => remove(id)} key={id} className="notification notification-success">
                {type} - {text}
            </div>
        );
    });

    return <div>{list}</div>;
};

NotificationsContainer.propTypes = {
    notifications: PropTypes.arrayOf(PropTypes.object).isRequired,
    remove: PropTypes.func.isRequired
};

export default NotificationsContainer;

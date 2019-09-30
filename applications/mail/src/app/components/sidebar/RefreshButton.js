import React from 'react';
import { Icon, useEventManager, useLoading } from 'react-components';

const RefreshButton = () => {
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();

    const handleRefresh = async (event) => {
        event.preventDefault();
        await call();
    };

    return (
        <button
            className="mr0-5"
            disabled={loading}
            type="button"
            onClick={(event) => withLoading(handleRefresh(event))}
        >
            <Icon fill="light" name="reload" />
        </button>
    );
};

export default RefreshButton;

import { Helmet } from 'react-helmet';

import useDynamicMonthDay from '@proton/components/hooks/useDynamicMonthDay';

import favicons from '../../assets/favicons';

const Favicon = () => {
    const onChangeMonthDay = () => {
        const defaultIcon = document.querySelector(
            'link[rel="icon"][type="image/svg+xml"]:not([data-dynamic-favicon])'
        );
        // Ensure the old svg favicon is removed, otherwise chrome has trouble updating to the dynamic icon.
        defaultIcon?.remove();
    };
    const monthDay = useDynamicMonthDay({ onChangeMonthDay });

    return (
        <Helmet>
            <link rel="icon" href={favicons[monthDay]} type="image/svg+xml" data-dynamic-favicon="true" />
        </Helmet>
    );
};

export default Favicon;

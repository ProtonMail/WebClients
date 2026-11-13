import { c } from 'ttag';

import { useConfig } from '@proton/app-context/useConfig';
import { Href } from '@proton/atoms/Href/Href';
import { getPrivacyPolicyURL } from '@proton/shared/lib/helpers/url';

import getBoldFormattedText from '../../helpers/getBoldFormattedText';

const DataCollectionDescription = () => {
    const { APP_NAME } = useConfig();

    return (
        <>
            {getBoldFormattedText(
                c('Info')
                    .t`To continuously improve our services, we sometimes collect data to monitor the proper functioning of our applications. **This information is not shared with any 3rd-party services.**`
            )}{' '}
            <Href href={getPrivacyPolicyURL(APP_NAME)}>{c('Link').t`Learn more`}</Href>
        </>
    );
};

export default DataCollectionDescription;

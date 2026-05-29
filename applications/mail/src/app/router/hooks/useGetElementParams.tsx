import { useLocation } from 'react-router-dom';

import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';
import type { SearchParameters } from '@proton/shared/lib/mail/search';

import { extractSearchParameters, pageFromUrl } from 'proton-mail/helpers/mailboxUrl';
import { useDeepMemo } from 'proton-mail/hooks/useDeepMemo';
import { selectParams } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { convertCustomViewLabelsToAlmostAllMail } from '../../helpers/labels';
import type { RouterNavigation } from '../interface';

interface Props {
    navigation: RouterNavigation;
}

export const useGetElementParams = ({ navigation }: Props) => {
    const location = useLocation();
    const [mailSettings] = useMailSettings();
    const { labelID, sort, filter, conversationMode } = useMailSelector(selectParams);

    const searchParameters = useDeepMemo<SearchParameters>(() => extractSearchParameters(location), [location]);

    return {
        conversationMode,
        labelID: convertCustomViewLabelsToAlmostAllMail(labelID),
        page: pageFromUrl(location),
        pageSize: mailSettings.PageSize || MAIL_PAGE_SIZE.FIFTY,
        sort: sort,
        filter: filter,
        search: searchParameters,
        onPage: navigation.handlePage,
        mailSettings: mailSettings,
    };
};

import { useLocation } from 'react-router-dom';

import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';
import { type SearchParameters } from '@proton/shared/lib/mail/search';

import { extractSearchParameters, pageFromUrl } from 'proton-mail/helpers/mailboxUrl';
import { useDeepMemo } from 'proton-mail/hooks/useDeepMemo';
import { type ElementsStateParams } from 'proton-mail/store/elements/elementsTypes';

import { convertCustomViewLabelsToAlmostAllMail } from '../../helpers/labels';
import type { RouterNavigation } from '../interface';

interface Props {
    params: ElementsStateParams;
    navigation: RouterNavigation;
}

export const useGetElementParams = ({ params, navigation }: Props) => {
    const location = useLocation();
    const [mailSettings] = useMailSettings();

    const searchParameters = useDeepMemo<SearchParameters>(() => extractSearchParameters(location), [location]);

    return {
        conversationMode: params.conversationMode,
        labelID: convertCustomViewLabelsToAlmostAllMail(params.labelID),
        page: pageFromUrl(location),
        pageSize: mailSettings?.PageSize || MAIL_PAGE_SIZE.FIFTY,
        sort: params.sort,
        filter: params.filter,
        search: searchParameters,
        onPage: navigation.handlePage,
        mailSettings: mailSettings!,
    };
};

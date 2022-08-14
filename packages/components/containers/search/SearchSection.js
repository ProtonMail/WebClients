import { c } from 'ttag';

import { updateAutoWildcardSearch } from '@proton/shared/lib/api/mailSettings';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Field, Info, Label, Row, Toggle } from '../../components';
import { useApi, useEventManager, useLoading, useMailSettings } from '../../hooks';

const SearchSection = () => {
    const api = useApi();
    const { call } = useEventManager();
    const [{ AutoWildcardSearch } = {}] = useMailSettings();
    const [loading, withLoading] = useLoading();
    return (
        <>
            <Row>
                <Label htmlFor="exactMatchToggle">
                    <span className="mr0-5">{c('Label').t`Require exact match`}</span>
                    <Info url={getKnowledgeBaseUrl('/search')} />
                </Label>
                <Field className="pt0-5">
                    <Toggle
                        loading={loading}
                        checked={!AutoWildcardSearch}
                        id="exactMatchToggle"
                        onChange={({ target: { checked } }) => {
                            withLoading(api(updateAutoWildcardSearch(+!checked)).then(call));
                        }}
                    />
                </Field>
            </Row>
        </>
    );
};

export default SearchSection;

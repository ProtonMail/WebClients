import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { updateAutoWildcardSearch } from '@proton/shared/lib/api/mailSettings';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Field, Info, Label, Row, Toggle } from '../../components';
import { useApi, useEventManager, useMailSettings } from '../../hooks';

const SearchSection = () => {
    const api = useApi();
    const { call } = useEventManager();
    const [{ AutoWildcardSearch } = {}] = useMailSettings();
    const [loading, withLoading] = useLoading();
    return (
        <>
            <Row>
                <Label htmlFor="exactMatchToggle">
                    <span className="mr-2">{c('Label').t`Require exact match`}</span>
                    <Info url={getKnowledgeBaseUrl('/search')} />
                </Label>
                <Field className="pt-2">
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

import React from 'react';
import { c } from 'ttag';
import { updateAutoWildcardSearch } from 'proton-shared/lib/api/mailSettings';
import { Row, Label, Info, Toggle, Field } from '../../components';
import { useMailSettings, useEventManager, useLoading, useApi } from '../../hooks';

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
                    <Info url="https://protonmail.com/support/knowledge-base/search/" />
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

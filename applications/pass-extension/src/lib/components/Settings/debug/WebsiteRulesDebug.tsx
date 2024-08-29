import { type FC, useCallback, useEffect, useState } from 'react';

import { Button } from '@proton/atoms/Button';
import TextArea from '@proton/components/components/v2/input/TextArea';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { validateRules } from '@proton/pass/lib/extension/utils/website-rules';
import browser from '@proton/pass/lib/globals/browser';
import debounce from '@proton/utils/debounce';
import noop from '@proton/utils/noop';

export const WebsiteRulesDebug: FC = () => {
    const [value, setValue] = useState<string>('');
    const [error, setError] = useState<boolean>(false);

    const validate = useCallback(
        debounce((data: string) => {
            try {
                const rules = JSON.parse(data);
                if (!validateRules(rules)) throw new Error();
                setError(false);
            } catch {
                setError(true);
            }
        }, 250),
        []
    );

    useEffect(() => {
        browser.storage.local
            .get('websiteRules')
            .then(({ websiteRules }) => {
                if (websiteRules) {
                    const rules = JSON.parse(websiteRules);
                    if (rules && validateRules(rules)) setValue(JSON.stringify(rules, null, 4));
                }
            })
            .catch(noop);
    }, []);

    useEffect(() => {
        validate.cancel();
        validate(value);
    }, [value]);

    return (
        <SettingsPanel title="Website rules">
            <div>
                <TextArea cols={10} value={value} error={error} onValue={setValue} />
                <Button
                    type="submit"
                    color="norm"
                    disabled={error}
                    className="mt-5 w-full"
                    onClick={() => browser.storage.local.set({ websiteRules: value })}
                >
                    Update
                </Button>
            </div>
        </SettingsPanel>
    );
};

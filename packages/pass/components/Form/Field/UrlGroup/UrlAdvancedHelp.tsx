import type { ChangeEvent, FormEvent } from 'react';
import { type FC, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcCross } from '@proton/icons/icons/IcCross';
import clsx from '@proton/utils/clsx';

import { testUrl } from '../../../../lib/urls/utils/autofill';
import { autofillHelp } from '../../../../lib/urls/utils/autofill.help';
import { AutofillMode, type UrlItem } from '../../../../types';

type Props = { url: UrlItem; initialUrl?: string; regexEnabled: boolean };

const getResultMessage = (mode: AutofillMode, matches: boolean) => {
    if (mode === AutofillMode.Never) {
        return matches
            ? c('Result').t`This URL will be blocked from autofill`
            : c('Result').t`This URL will NOT be blocked from autofill`;
    }
    return matches ? c('Result').t`URL matches the rule` : c('Result').t`URL doesn't match the rule`;
};

export const UrlAdvancedHelp: FC<Props> = ({ url: { url, mode }, initialUrl, regexEnabled }) => {
    const [urlToTest, setUrlToTest] = useState(initialUrl ?? 'https://proton.me');
    const [result, setResult] = useState<boolean>();

    useEffect(() => setResult(undefined), [mode, url]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setUrlToTest(event.target.value);
        setResult(undefined);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // For the mode Never, we test the inverse
        const modeToTest = mode === AutofillMode.Never ? AutofillMode.ExactPath : mode;
        setResult(testUrl(urlToTest, { mode: modeToTest, url }, regexEnabled));
    };

    return (
        <>
            <h4>{c('Title').t`Test a URL against this rule`}</h4>

            <form className="flex flex-row gap-2 pt-4" onSubmit={handleSubmit}>
                <Input key="urlCode" value={urlToTest} onChange={handleChange} placeholder={autofillHelp[mode].url} />
                <Button type="submit" className="text-semibold" shape="solid" pill>
                    {c('Label').t`Check`}
                </Button>
            </form>

            {result !== undefined ? (
                <p className={clsx(result ? 'color-success' : 'color-danger')}>
                    <span className={clsx('rounded-full p-0.5 mr-2', result ? 'bg-success' : 'bg-danger')}>
                        {result ? <IcCheckmark className="pb-1" /> : <IcCross className="pb-1" />}
                    </span>

                    {getResultMessage(mode, result)}
                </p>
            ) : (
                <p className="color-weak">{c('Result').t`Enter a URL to check if it matches the current rule`}</p>
            )}
        </>
    );
};

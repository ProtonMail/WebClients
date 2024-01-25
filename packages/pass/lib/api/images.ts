import { type Maybe } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export const imageResponsetoDataURL = (response: Response): Promise<Maybe<string>> =>
    new Promise<Maybe<string>>(async (resolve, reject) => {
        try {
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result?.toString());
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        } catch {
            reject();
        }
    }).catch(noop);

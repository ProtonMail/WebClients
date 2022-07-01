import { DecryptedLink } from '../../store';

export interface PublicLink extends DecryptedLink {
    id: string;
    progress?: {
        total?: number;
        progress: number;
        percent: number;
        isFinished: boolean;
    };
}

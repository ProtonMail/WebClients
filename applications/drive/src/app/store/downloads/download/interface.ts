import { ReadableStream } from 'web-streams-polyfill';

import { LinkType } from '../../links';
import { LinkDownload } from '../interface';

export type NestedLinkDownload = LinkDownload & {
    parentPath: string[];
};

export type StartedNestedLinkDownload =
    | {
          type: LinkType.FOLDER;
          name: string;
          parentPath: string[];
      }
    | {
          type: LinkType.FILE;
          name: string;
          parentPath: string[];
          stream: ReadableStream<Uint8Array>;
      };

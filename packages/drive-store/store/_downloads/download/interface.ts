import { ReadableStream } from 'web-streams-polyfill';

import { LinkDownload } from '../interface';

export type NestedLinkDownload = LinkDownload & {
    parentLinkIds: string[];
    parentPath: string[];
};

export type StartedNestedLinkDownload =
    | {
          isFile: false;
          name: string;
          parentPath: string[];
      }
    | {
          isFile: true;
          name: string;
          parentPath: string[];
          stream: ReadableStream<Uint8Array>;
          fileModifyTime?: number;
      };

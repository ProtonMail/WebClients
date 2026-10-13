import type { PipelineBackground, PipelineConfig } from './BackgroundPipeline';

export type PipelineWorkerRequest =
    | {
          type: 'init';
          config: PipelineConfig;
          width: number;
          height: number;
          segmenterPort: MessagePort;
          pageHidden: boolean;
      }
    | { type: 'attach-streams'; readable: ReadableStream<VideoFrame>; writable: WritableStream<VideoFrame> }
    | { type: 'attach-track'; track: MediaStreamTrack }
    | { type: 'set-input-state'; enabled: boolean; stopped: boolean }
    | { type: 'set-segmenter'; port: MessagePort | null }
    | { type: 'set-background'; id: number; background: PipelineBackground }
    | { type: 'set-enabled'; enabled: boolean }
    | { type: 'set-page-hidden'; hidden: boolean }
    | { type: 'destroy' };

export type PipelineWorkerEvent =
    | { type: 'capabilities'; trackProcessing: boolean }
    | { type: 'ready' }
    | { type: 'init-failed'; message: string }
    | { type: 'track'; track: MediaStreamTrack }
    | { type: 'attach-failed'; message: string }
    | { type: 'applied' }
    | { type: 'initialization-failed'; message: string }
    | { type: 'background-done'; id: number; error?: string };

import type { StreamData } from '../core/types';
interface UseWidgetStreamOptions {
    throttle?: number;
    debounce?: number;
    maxBuffer?: number;
    compression?: number;
    distinctBy?: (item: StreamData) => any;
}
export declare function useWidgetStream<T extends StreamData>(streamId?: string, options?: UseWidgetStreamOptions): T[];
export declare function emitToStream(streamId: string, data: StreamData): void;
export declare function emitBatchToStream(streamId: string, dataArray: StreamData[]): void;
export declare function clearStream(streamId: string): void;
export declare function getStreamStats(streamId: string): {
    count: number;
    lastUpdate: number;
    isActive: boolean;
};
export declare function removeStream(streamId: string): void;
export {};

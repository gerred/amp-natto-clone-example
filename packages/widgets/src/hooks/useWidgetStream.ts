import React from 'react';
import { BehaviorSubject, Observable } from 'rxjs';
import { throttleTime, debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import type { StreamData } from '../core/types';

// Global registry for stream subjects
const streamRegistry = new Map<string, BehaviorSubject<StreamData[]>>();

interface UseWidgetStreamOptions {
  throttle?: number;
  debounce?: number;
  maxBuffer?: number;
  compression?: number;
  distinctBy?: (item: StreamData) => any;
}

export function useWidgetStream<T extends StreamData>(
  streamId?: string, 
  options: UseWidgetStreamOptions = {}
): T[] {
  const [data, setData] = React.useState<T[]>([]);
  const {
    throttle = 0,
    debounce = 0,
    maxBuffer = 1000,
    compression = 1,
    distinctBy
  } = options;

  React.useEffect(() => {
    if (!streamId) return;

    // Get or create stream subject
    let subject = streamRegistry.get(streamId);
    if (!subject) {
      subject = new BehaviorSubject<StreamData[]>([]);
      streamRegistry.set(streamId, subject);
    }

    // Create observable with performance optimizations
    let observable: Observable<StreamData[]> = subject.asObservable();

    // Apply throttling
    if (throttle > 0) {
      observable = observable.pipe(throttleTime(throttle));
    }

    // Apply debouncing
    if (debounce > 0) {
      observable = observable.pipe(debounceTime(debounce));
    }

    // Apply distinct filtering
    if (distinctBy) {
      observable = observable.pipe(
        distinctUntilChanged((prev, curr) => {
          if (prev.length !== curr.length) return false;
          const lastPrev = prev[prev.length - 1];
          const lastCurr = curr[curr.length - 1];
          return lastPrev && lastCurr && distinctBy(lastPrev) === distinctBy(lastCurr);
        })
      );
    }

    // Apply compression for performance
    if (compression < 1) {
      observable = observable.pipe(
        map(streamData => {
          if (streamData.length === 0) return streamData;
          
          const targetSize = Math.floor(streamData.length * compression);
          if (streamData.length <= targetSize) return streamData;

          // Simple compression: take every nth item plus latest
          const step = Math.floor(streamData.length / targetSize);
          const compressed: StreamData[] = [];
          
          for (let i = 0; i < streamData.length; i += step) {
            compressed.push(streamData[i]);
          }
          
          // Always include the latest data point
          if (compressed[compressed.length - 1] !== streamData[streamData.length - 1]) {
            compressed.push(streamData[streamData.length - 1]);
          }
          
          return compressed;
        })
      );
    }

    // Subscribe to stream
    const subscription = observable.subscribe((streamData) => {
      setData(streamData as T[]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [streamId, throttle, debounce, compression, distinctBy]);

  return data;
}

// Helper function to emit data to a stream
export function emitToStream(streamId: string, data: StreamData): void {
  let subject = streamRegistry.get(streamId);
  if (!subject) {
    subject = new BehaviorSubject<StreamData[]>([]);
    streamRegistry.set(streamId, subject);
  }

  const currentData = subject.value;
  const maxItems = 1000; // Limit to prevent memory issues
  const newData = [...currentData, data].slice(-maxItems);
  subject.next(newData);
}

// Batch emit for better performance
export function emitBatchToStream(streamId: string, dataArray: StreamData[]): void {
  let subject = streamRegistry.get(streamId);
  if (!subject) {
    subject = new BehaviorSubject<StreamData[]>([]);
    streamRegistry.set(streamId, subject);
  }

  const currentData = subject.value;
  const maxItems = 1000;
  const newData = [...currentData, ...dataArray].slice(-maxItems);
  subject.next(newData);
}

// Clear stream data
export function clearStream(streamId: string): void {
  const subject = streamRegistry.get(streamId);
  if (subject) {
    subject.next([]);
  }
}

// Get stream stats
export function getStreamStats(streamId: string): {
  count: number;
  lastUpdate: number;
  isActive: boolean;
} {
  const subject = streamRegistry.get(streamId);
  if (!subject) {
    return { count: 0, lastUpdate: 0, isActive: false };
  }

  const data = subject.value;
  return {
    count: data.length,
    lastUpdate: data.length > 0 ? data[data.length - 1].timestamp : 0,
    isActive: subject.observers.length > 0
  };
}

// Remove stream
export function removeStream(streamId: string): void {
  const subject = streamRegistry.get(streamId);
  if (subject) {
    subject.complete();
    streamRegistry.delete(streamId);
  }
}

import React from 'react';
import { WidgetContainer } from './WidgetContainer';
import { useWidgetStream } from '../hooks/useWidgetStream';
import type { WidgetProps, LogData } from '../types';

export function LogWidget({ id, title, streamId }: WidgetProps) {
  const data = useWidgetStream<LogData>(streamId);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [data]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return '#ff4444';
      case 'warn':
        return '#ffaa00';
      case 'info':
        return '#00aaff';
      case 'debug':
        return '#888888';
      default:
        return '#000000';
    }
  };

  return (
    <WidgetContainer id={id} title={title || 'Log'}>
      <div
        ref={containerRef}
        style={{
          height: '300px',
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px',
          backgroundColor: '#1e1e1e',
          color: '#ffffff',
          padding: '8px',
        }}
      >
        {data.slice(-100).map((item, index) => (
          <div key={`${item.timestamp}-${index}`} style={{ marginBottom: '2px' }}>
            <span style={{ color: '#888' }}>{new Date(item.timestamp).toLocaleTimeString()}</span>
            <span
              style={{
                color: getLevelColor(item.value.level),
                marginLeft: '8px',
                marginRight: '8px',
              }}
            >
              [{item.value.level.toUpperCase()}]
            </span>
            <span>{item.value.message}</span>
          </div>
        ))}
      </div>
    </WidgetContainer>
  );
}

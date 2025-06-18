import React, { useMemo, useRef, useEffect } from 'react';
import { useLogStream } from '../hooks/useStreamData';
import type { WidgetProps } from '../types';

interface StreamingLogsProps extends WidgetProps {
  maxLogs?: number;
  updateInterval?: number;
  showMetrics?: boolean;
  autoScroll?: boolean;
  defaultLogLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export function StreamingLogs({ 
  id, 
  title = 'Streaming Logs',
  streamId,
  maxLogs = 1000,
  updateInterval = 50, // Fast updates for logs
  showMetrics = false,
  autoScroll = true,
  defaultLogLevel = 'info',
  config 
}: StreamingLogsProps) {
  const { 
    filteredLogs, 
    isConnected, 
    error, 
    metrics,
    logLevels,
    setLogLevel
  } = useLogStream(streamId || id, {
    maxLogs,
    updateInterval,
    logLevel: defaultLogLevel,
    enableBackpressure: true
  });

  const logsContainerRef = useRef<HTMLDivElement>(null);
  const [selectedLevel, setSelectedLevel] = React.useState(defaultLogLevel);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const handleLogLevelChange = (level: 'debug' | 'info' | 'warn' | 'error') => {
    setSelectedLevel(level);
    setLogLevel(level);
  };

  const logLevelColors = {
    debug: '#9E9E9E',
    info: '#2196F3',
    warn: '#FF9800',
    error: '#F44336'
  };

  const logLevelBgColors = {
    debug: '#F5F5F5',
    info: '#E3F2FD',
    warn: '#FFF3E0',
    error: '#FFEBEE'
  };

  const connectionStatus = useMemo(() => {
    if (error) return 'error';
    if (!isConnected) return 'disconnected';
    return 'connected';
  }, [isConnected, error]);

  const statusColor = {
    connected: '#4CAF50',
    disconnected: '#FF9800',
    error: '#F44336'
  }[connectionStatus];

  return (
    <div className="streaming-logs" style={{ 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      backgroundColor: '#fff',
      height: '400px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid #eee'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
          {title}
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {logLevels.map(level => (
              <button
                key={level}
                onClick={() => handleLogLevelChange(level)}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: selectedLevel === level ? 'bold' : 'normal',
                  backgroundColor: selectedLevel === level ? logLevelBgColors[level] : '#fff',
                  color: selectedLevel === level ? logLevelColors[level] : '#666',
                  cursor: 'pointer'
                }}
              >
                {level.toUpperCase()}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: statusColor
            }} />
            <span style={{ fontSize: '12px', color: '#666' }}>
              {connectionStatus}
            </span>
          </div>
        </div>
      </div>

      {error ? (
        <div style={{ 
          color: '#F44336', 
          padding: '16px', 
          backgroundColor: '#FFEBEE',
          margin: '16px',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          Error: {error.message}
        </div>
      ) : (
        <div 
          ref={logsContainerRef}
          style={{ 
            flex: 1,
            overflowY: 'auto',
            padding: '8px 0',
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: '1.4'
          }}
        >
          {filteredLogs.map((log, index) => {
            const logData = log.value as { level: keyof typeof logLevelColors; message: string; details?: unknown };
            return (
              <div 
                key={`${log.timestamp}-${index}`}
                style={{ 
                  padding: '4px 16px',
                  borderLeft: `3px solid ${logLevelColors[logData.level]}`,
                  backgroundColor: index % 2 === 0 ? '#fff' : '#FAFAFA',
                  display: 'flex',
                  gap: '12px'
                }}
              >
                <span style={{ 
                  color: '#666', 
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  minWidth: '80px'
                }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                
                <span style={{ 
                  color: logLevelColors[logData.level],
                  fontWeight: 'bold',
                  minWidth: '50px',
                  textTransform: 'uppercase'
                }}>
                  {logData.level}
                </span>
                
                <span style={{ flex: 1 }}>
                  {logData.message}
                  {logData.details && (
                    <details style={{ marginTop: '4px' }}>
                      <summary style={{ 
                        cursor: 'pointer', 
                        color: '#666',
                        fontSize: '12px'
                      }}>
                        Details
                      </summary>
                      <pre style={{ 
                        marginTop: '4px',
                        padding: '8px',
                        backgroundColor: '#F5F5F5',
                        borderRadius: '4px',
                        fontSize: '11px',
                        overflow: 'auto'
                      }}>
                        {JSON.stringify(logData.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </span>
              </div>
            );
          })}
          
          {filteredLogs.length === 0 && (
            <div style={{ 
              padding: '32px 16px',
              textAlign: 'center',
              color: '#666',
              fontStyle: 'italic'
            }}>
              No logs at {selectedLevel} level or above
            </div>
          )}
        </div>
      )}

      {showMetrics && (
        <div style={{ 
          padding: '12px 16px',
          backgroundColor: '#F5F5F5',
          borderTop: '1px solid #eee',
          fontSize: '12px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: '8px'
        }}>
          <div>
            <strong>Total Messages:</strong> {metrics.messageCount}
          </div>
          <div>
            <strong>Latency:</strong> {metrics.averageLatency.toFixed(1)}ms
          </div>
          <div>
            <strong>Filtered Logs:</strong> {filteredLogs.length}
          </div>
          <div>
            <strong>Level:</strong> {selectedLevel.toUpperCase()}+
          </div>
        </div>
      )}
    </div>
  );
}

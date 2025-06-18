import React, { useMemo } from 'react';
import { useTableStream } from '../hooks/useStreamData';
import type { WidgetProps } from '../types';

interface StreamingTableProps extends WidgetProps {
  pageSize?: number;
  updateInterval?: number;
  showMetrics?: boolean;
  columns?: Array<{
    key: string;
    label: string;
    width?: string;
    formatter?: (value: unknown) => string;
  }>;
}

export function StreamingTable({ 
  id, 
  title = 'Streaming Table',
  streamId,
  pageSize = 50,
  updateInterval = 100, // Slower updates for tables
  showMetrics = false,
  columns,
  config 
}: StreamingTableProps) {
  const { 
    tableData, 
    isConnected, 
    error, 
    metrics,
    currentPage,
    totalPages,
    setPage
  } = useTableStream(streamId || id, {
    pageSize,
    updateInterval,
    enableBackpressure: true
  });

  const autoColumns = useMemo(() => {
    if (columns) return columns;
    
    if (tableData.length === 0) return [];
    
    const firstRow = tableData[0].value as Record<string, unknown>;
    return Object.keys(firstRow).map(key => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      formatter: (value: unknown) => String(value)
    }));
  }, [columns, tableData]);

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
    <div className="streaming-table" style={{ 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      backgroundColor: '#fff'
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
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#F5F5F5' }}>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left',
                    borderBottom: '1px solid #ddd',
                    fontWeight: 'bold',
                    width: '80px'
                  }}>
                    Time
                  </th>
                  {autoColumns.map(column => (
                    <th key={column.key} style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left',
                      borderBottom: '1px solid #ddd',
                      fontWeight: 'bold',
                      width: column.width
                    }}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((item, index) => (
                  <tr key={`${item.timestamp}-${index}`} style={{ 
                    backgroundColor: index % 2 === 0 ? '#fff' : '#F9F9F9'
                  }}>
                    <td style={{ 
                      padding: '12px 16px',
                      borderBottom: '1px solid #eee',
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                    {autoColumns.map(column => {
                      const value = (item.value as Record<string, unknown>)[column.key];
                      const formatted = column.formatter ? column.formatter(value) : String(value);
                      return (
                        <td key={column.key} style={{ 
                          padding: '12px 16px',
                          borderBottom: '1px solid #eee'
                        }}>
                          {formatted}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              gap: '8px',
              padding: '16px',
              borderTop: '1px solid #eee'
            }}>
              <button 
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 0}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: currentPage === 0 ? '#f5f5f5' : '#fff',
                  cursor: currentPage === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '14px', color: '#666' }}>
                Page {currentPage + 1} of {totalPages}
              </span>
              <button 
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: currentPage >= totalPages - 1 ? '#f5f5f5' : '#fff',
                  cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
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
            <strong>Visible Rows:</strong> {tableData.length}
          </div>
          <div>
            <strong>Page:</strong> {currentPage + 1}/{totalPages}
          </div>
        </div>
      )}
    </div>
  );
}

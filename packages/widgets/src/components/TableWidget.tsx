import React from 'react';
import { WidgetContainer } from './WidgetContainer';
import { useWidgetStream } from '../hooks/useWidgetStream';
import type { WidgetProps, TableData } from '../types';

export function TableWidget({ id, title, streamId }: WidgetProps) {
  const data = useWidgetStream<TableData>(streamId);

  const columns = React.useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]?.value || {});
  }, [data]);

  return (
    <WidgetContainer id={id} title={title || 'Table'}>
      <div style={{ maxHeight: '300px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  style={{
                    border: '1px solid #ddd',
                    padding: '8px',
                    backgroundColor: '#f5f5f5',
                  }}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(-50).map((item, index) => (
              <tr key={`${item.timestamp}-${index}`}>
                {columns.map((column) => (
                  <td
                    key={column}
                    style={{
                      border: '1px solid #ddd',
                      padding: '8px',
                    }}
                  >
                    {String(item.value[column] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetContainer>
  );
}

import React, { useEffect, useState } from 'react';
import {
  EnhancedChartWidget,
  VirtualizedTableWidget,
  StreamingLogWidget,
  InteractiveFormWidget,
  emitToStream,
  emitBatchToStream,
  streamManager
} from '../index';

// Demo data generators
const generateChartData = () => ({
  timestamp: Date.now(),
  value: Math.random() * 100 + Math.sin(Date.now() / 1000) * 20,
  metadata: { source: 'demo-generator' }
});

const generateTableData = () => ({
  timestamp: Date.now(),
  value: {
    id: Math.floor(Math.random() * 1000),
    name: `User ${Math.floor(Math.random() * 100)}`,
    email: `user${Math.floor(Math.random() * 100)}@example.com`,
    score: Math.floor(Math.random() * 100),
    category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
    active: Math.random() > 0.3
  },
  metadata: { source: 'user-activity' }
});

const generateLogData = () => {
  const levels = ['info', 'warn', 'error', 'debug'] as const;
  const sources = ['api', 'database', 'auth', 'worker', 'scheduler'];
  const messages = [
    'User authentication successful',
    'Database query executed',
    'API endpoint called',
    'Background job completed',
    'Cache miss occurred',
    'Rate limit exceeded',
    'Connection timeout',
    'Data validation failed'
  ];

  return {
    timestamp: Date.now(),
    value: {
      level: levels[Math.floor(Math.random() * levels.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      details: {
        userId: Math.floor(Math.random() * 1000),
        requestId: `req-${Math.random().toString(36).substr(2, 9)}`,
        duration: Math.floor(Math.random() * 1000)
      }
    },
    metadata: { source: 'application-logs' }
  };
};

// Real-time Chart Demo
export const RealTimeChartDemo: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const streamId = 'demo-chart-stream';

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isStreaming) {
      // High-frequency updates for smooth animation
      interval = setInterval(() => {
        emitToStream(streamId, generateChartData());
      }, 16); // ~60 FPS
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, streamId]);

  const chartConfig = {
    type: 'line' as const,
    animation: false,
    grid: true,
    tooltip: true,
    legend: false,
    lines: [{
      dataKey: 'value',
      color: '#3b82f6',
      strokeWidth: 2,
      dot: false
    }]
  };

  return (
    <div className="demo-section">
      <h3>Real-time Chart Demo</h3>
      <div className="demo-controls">
        <button onClick={() => setIsStreaming(!isStreaming)}>
          {isStreaming ? 'Stop Stream' : 'Start Stream'}
        </button>
        <span>Update Rate: 60 FPS</span>
      </div>
      <EnhancedChartWidget
        id="demo-chart"
        title="Real-time Data Stream"
        streamId={streamId}
        chartConfig={chartConfig}
        realTimeUpdate={true}
        compressionRatio={0.8}
        virtualizeThreshold={1000}
        style={{ width: 800, height: 400 }}
      />
    </div>
  );
};

// Virtualized Table Demo
export const VirtualizedTableDemo: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [recordCount, setRecordCount] = useState(0);
  const streamId = 'demo-table-stream';

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isStreaming) {
      interval = setInterval(() => {
        // Batch updates for better performance
        const batch = Array.from({ length: 10 }, generateTableData);
        emitBatchToStream(streamId, batch);
        setRecordCount(prev => prev + batch.length);
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, streamId]);

  const tableConfig = {
    columns: [
      { key: 'id', title: 'ID', width: 80, sortable: true, filterable: false },
      { key: 'name', title: 'Name', width: 150, sortable: true, filterable: true },
      { key: 'email', title: 'Email', width: 200, sortable: true, filterable: true },
      { key: 'score', title: 'Score', width: 100, sortable: true, filterable: false },
      { key: 'category', title: 'Category', width: 100, sortable: true, filterable: true },
      { key: 'active', title: 'Active', width: 80, sortable: true, filterable: false,
        render: (value: boolean) => value ? '✅' : '❌' }
    ],
    sortable: true,
    filterable: true,
    selectable: true,
    multiSelect: true,
    virtualScrolling: {
      enabled: true,
      threshold: 100
    }
  };

  return (
    <div className="demo-section">
      <h3>Virtualized Table Demo</h3>
      <div className="demo-controls">
        <button onClick={() => setIsStreaming(!isStreaming)}>
          {isStreaming ? 'Stop Stream' : 'Start Stream'}
        </button>
        <span>Records: {recordCount}</span>
        <button onClick={() => {
          streamManager.clearStream(streamId);
          setRecordCount(0);
        }}>
          Clear Data
        </button>
      </div>
      <VirtualizedTableWidget
        id="demo-table"
        title="Live User Activity"
        streamId={streamId}
        tableConfig={tableConfig}
        realTimeUpdate={true}
        maxRows={10000}
        style={{ width: 900, height: 500 }}
      />
    </div>
  );
};

// Streaming Logs Demo
export const StreamingLogsDemo: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [logCount, setLogCount] = useState(0);
  const streamId = 'demo-logs-stream';

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isStreaming) {
      interval = setInterval(() => {
        emitToStream(streamId, generateLogData());
        setLogCount(prev => prev + 1);
      }, 500 + Math.random() * 1000); // Variable interval
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, streamId]);

  const logConfig = {
    maxEntries: 5000,
    autoScroll: true,
    showTimestamp: true,
    showLevel: true,
    showSource: true,
    levelColors: {
      trace: '#6b7280',
      debug: '#3b82f6',
      info: '#10b981',
      warn: '#f59e0b',
      error: '#ef4444',
      fatal: '#dc2626'
    },
    performance: {
      virtualization: true,
      batchSize: 100,
      updateInterval: 16
    }
  };

  return (
    <div className="demo-section">
      <h3>Streaming Logs Demo</h3>
      <div className="demo-controls">
        <button onClick={() => setIsStreaming(!isStreaming)}>
          {isStreaming ? 'Stop Stream' : 'Start Stream'}
        </button>
        <span>Log Entries: {logCount}</span>
        <button onClick={() => {
          streamManager.clearStream(streamId);
          setLogCount(0);
        }}>
          Clear Logs
        </button>
      </div>
      <StreamingLogWidget
        id="demo-logs"
        title="Application Logs"
        streamId={streamId}
        logConfig={logConfig}
        realTimeUpdate={true}
        maxEntries={5000}
        style={{ width: 900, height: 600 }}
      />
    </div>
  );
};

// Interactive Form Demo
export const InteractiveFormDemo: React.FC = () => {
  const [formData, setFormData] = useState({});
  const [submissionCount, setSubmissionCount] = useState(0);

  const formConfig = {
    fields: [
      {
        key: 'name',
        type: 'text' as const,
        label: 'Full Name',
        required: true,
        validation: [
          { type: 'required' as const, message: 'Name is required' },
          { type: 'minLength' as const, value: 2, message: 'Name must be at least 2 characters' }
        ]
      },
      {
        key: 'email',
        type: 'email' as const,
        label: 'Email Address',
        required: true,
        validation: [
          { type: 'required' as const, message: 'Email is required' },
          { type: 'email' as const, message: 'Please enter a valid email address' }
        ]
      },
      {
        key: 'age',
        type: 'number' as const,
        label: 'Age',
        min: 0,
        max: 120,
        validation: [
          { type: 'min' as const, value: 0, message: 'Age must be positive' },
          { type: 'max' as const, value: 120, message: 'Age must be realistic' }
        ]
      },
      {
        key: 'category',
        type: 'select' as const,
        label: 'Category',
        options: [
          { value: 'developer', label: 'Developer' },
          { value: 'designer', label: 'Designer' },
          { value: 'manager', label: 'Manager' },
          { value: 'other', label: 'Other' }
        ],
        required: true
      },
      {
        key: 'skills',
        type: 'checkbox' as const,
        label: 'Has Technical Skills',
        defaultValue: false
      },
      {
        key: 'experience',
        type: 'radio' as const,
        label: 'Experience Level',
        options: [
          { value: 'junior', label: 'Junior (0-2 years)' },
          { value: 'mid', label: 'Mid-level (3-5 years)' },
          { value: 'senior', label: 'Senior (6+ years)' }
        ],
        required: true
      },
      {
        key: 'bio',
        type: 'textarea' as const,
        label: 'Biography',
        placeholder: 'Tell us about yourself...',
        rows: 4,
        validation: [
          { type: 'maxLength' as const, value: 500, message: 'Bio must be under 500 characters' }
        ]
      },
      {
        key: 'rating',
        type: 'range' as const,
        label: 'Overall Satisfaction',
        min: 1,
        max: 10,
        defaultValue: 5
      }
    ],
    layout: 'vertical' as const,
    submitButton: {
      label: 'Submit Application'
    },
    resetButton: {
      label: 'Reset Form',
      confirm: true
    },
    validation: {
      mode: 'onChange' as const,
      showErrors: true,
      stopOnFirstError: false
    },
    autoSave: {
      enabled: true,
      delay: 2000,
      key: 'demo-form-autosave'
    }
  };

  const handleSubmit = async (data: Record<string, any>) => {
    console.log('Form submitted:', data);
    setSubmissionCount(prev => prev + 1);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    alert('Form submitted successfully!');
  };

  const handleChange = (data: Record<string, any>, field?: string) => {
    setFormData(data);
    if (field) {
      console.log(`Field ${field} changed:`, data[field]);
    }
  };

  return (
    <div className="demo-section">
      <h3>Interactive Form Demo</h3>
      <div className="demo-info">
        <p>Form submissions: {submissionCount}</p>
        <p>Auto-save enabled (2 second delay)</p>
        <details>
          <summary>Current form data</summary>
          <pre>{JSON.stringify(formData, null, 2)}</pre>
        </details>
      </div>
      <InteractiveFormWidget
        id="demo-form"
        title="User Registration Form"
        formConfig={formConfig}
        onSubmit={handleSubmit}
        onChange={handleChange}
        style={{ width: 600, maxHeight: 800 }}
      />
    </div>
  );
};

// Performance Demo
export const PerformanceDemo: React.FC = () => {
  const [isStressTest, setIsStressTest] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    if (isStressTest) {
      // Start multiple streams with high frequency
      const streams = ['stress-chart', 'stress-table', 'stress-logs'];
      
      const intervals = streams.map(streamId => {
        return setInterval(() => {
          // Emit different types of data
          if (streamId.includes('chart')) {
            emitToStream(streamId, generateChartData());
          } else if (streamId.includes('table')) {
            emitBatchToStream(streamId, Array.from({ length: 20 }, generateTableData));
          } else {
            emitToStream(streamId, generateLogData());
          }
        }, 10); // Very high frequency
      });

      // Monitor performance
      const metricsInterval = setInterval(() => {
        const streamStats = streams.map(id => streamManager.getMetrics(id));
        setMetrics(streamStats);
      }, 1000);

      return () => {
        intervals.forEach(clearInterval);
        clearInterval(metricsInterval);
        streams.forEach(id => streamManager.clearStream(id));
      };
    }
  }, [isStressTest]);

  return (
    <div className="demo-section">
      <h3>Performance Stress Test</h3>
      <div className="demo-controls">
        <button onClick={() => setIsStressTest(!isStressTest)}>
          {isStressTest ? 'Stop Stress Test' : 'Start Stress Test'}
        </button>
        {isStressTest && <span style={{ color: 'red' }}>⚠️ High CPU Usage</span>}
      </div>
      
      {metrics && (
        <div className="performance-metrics">
          <h4>Stream Metrics:</h4>
          <pre>{JSON.stringify(metrics, null, 2)}</pre>
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <EnhancedChartWidget
          id="stress-chart"
          title="Stress Test Chart"
          streamId="stress-chart"
          chartConfig={{ type: 'line', animation: false }}
          compressionRatio={0.5}
          virtualizeThreshold={500}
          showPerformanceMetrics={true}
          style={{ height: 300 }}
        />
        
        <VirtualizedTableWidget
          id="stress-table"
          title="Stress Test Table"
          streamId="stress-table"
          tableConfig={{
            columns: [
              { key: 'id', title: 'ID', width: 80 },
              { key: 'name', title: 'Name', width: 120 },
              { key: 'score', title: 'Score', width: 80 }
            ],
            virtualScrolling: { enabled: true, threshold: 50 }
          }}
          maxRows={1000}
          style={{ height: 300 }}
        />
      </div>
      
      <StreamingLogWidget
        id="stress-logs"
        title="Stress Test Logs"
        streamId="stress-logs"
        logConfig={{
          maxEntries: 1000,
          performance: { virtualization: true, batchSize: 50, updateInterval: 32 }
        }}
        style={{ height: 300, marginTop: '20px' }}
      />
    </div>
  );
};

// Main demo app
export const WidgetDemoApp: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState('chart');

  const demos = [
    { id: 'chart', name: 'Real-time Chart', component: RealTimeChartDemo },
    { id: 'table', name: 'Virtualized Table', component: VirtualizedTableDemo },
    { id: 'logs', name: 'Streaming Logs', component: StreamingLogsDemo },
    { id: 'form', name: 'Interactive Form', component: InteractiveFormDemo },
    { id: 'performance', name: 'Performance Test', component: PerformanceDemo }
  ];

  const ActiveComponent = demos.find(d => d.id === activeDemo)?.component || RealTimeChartDemo;

  return (
    <div className="widget-demo-app">
      <header className="demo-header">
        <h1>Node Flow Widget Framework Demo</h1>
        <p>Comprehensive live widget system with real-time data streaming and performance optimization</p>
      </header>
      
      <nav className="demo-nav">
        {demos.map(demo => (
          <button
            key={demo.id}
            onClick={() => setActiveDemo(demo.id)}
            className={activeDemo === demo.id ? 'active' : ''}
          >
            {demo.name}
          </button>
        ))}
      </nav>
      
      <main className="demo-content">
        <ActiveComponent />
      </main>
      
      <footer className="demo-footer">
        <p>Target Performance: &lt;100ms update latency • 60 FPS rendering • 10k+ data points</p>
        <p>Features: Real-time streaming • Virtualization • State persistence • Performance monitoring</p>
      </footer>
      
      <style jsx>{`
        .widget-demo-app {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .demo-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e0e0e0;
        }
        
        .demo-header h1 {
          color: #333;
          margin-bottom: 10px;
        }
        
        .demo-header p {
          color: #666;
          font-size: 16px;
        }
        
        .demo-nav {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
          overflow-x: auto;
        }
        
        .demo-nav button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        
        .demo-nav button:hover {
          background: #e3f2fd;
        }
        
        .demo-nav button.active {
          background: #2196f3;
          color: white;
        }
        
        .demo-section {
          margin-bottom: 30px;
        }
        
        .demo-section h3 {
          margin-bottom: 15px;
          color: #333;
        }
        
        .demo-controls {
          display: flex;
          gap: 15px;
          align-items: center;
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        
        .demo-controls button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          background: #2196f3;
          color: white;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .demo-controls button:hover {
          background: #1976d2;
        }
        
        .demo-info {
          margin-bottom: 20px;
          padding: 15px;
          background: #e8f5e8;
          border-radius: 6px;
        }
        
        .demo-info details {
          margin-top: 10px;
        }
        
        .demo-info pre {
          background: white;
          padding: 10px;
          border-radius: 4px;
          overflow: auto;
          max-height: 200px;
        }
        
        .performance-metrics {
          margin: 20px 0;
          padding: 15px;
          background: #fff3cd;
          border-radius: 6px;
        }
        
        .performance-metrics pre {
          background: white;
          padding: 10px;
          border-radius: 4px;
          overflow: auto;
          max-height: 300px;
        }
        
        .demo-footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
          text-align: center;
          color: #666;
        }
        
        .demo-footer p {
          margin: 5px 0;
        }
      `}</style>
    </div>
  );
};

export default WidgetDemoApp;

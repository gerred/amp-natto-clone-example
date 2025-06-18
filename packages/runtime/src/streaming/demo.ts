#!/usr/bin/env node

/**
 * Streaming Engine Demo
 * 
 * This demo showcases the real-time streaming capabilities of the Node Flow platform.
 * Run with: node -r ts-node/register src/streaming/demo.ts
 */

import {
  StreamEngine,
  StreamDebugger,
  PerformanceTestSuite,
  AdaptiveBackpressureHandler,
  GracefulErrorRecovery,
  STANDARD_PERFORMANCE_TESTS
} from './index';

async function runStreamingDemo() {
  console.log('🚀 Node Flow Streaming Engine Demo\n');

  // 1. Basic Streaming Setup
  console.log('1. Setting up streaming engine...');
  const streamEngine = new StreamEngine();
  const streamDebugger = new StreamDebugger(streamEngine);
  
  // Configure handlers
  streamEngine.setBackpressureHandler(new AdaptiveBackpressureHandler());
  streamEngine.setErrorRecovery(new GracefulErrorRecovery());
  
  streamDebugger.startRecording();

  // 2. Create connections
  console.log('2. Creating stream connections...');
  const connections = [
    streamEngine.createConnection('dataSource', 'processor', 'output', 'input'),
    streamEngine.createConnection('processor', 'aggregator', 'output', 'input'),
    streamEngine.createConnection('aggregator', 'widget', 'output', 'input')
  ];

  console.log(`   Created ${connections.length} connections`);

  // 3. Demonstrate real-time data flow
  console.log('3. Starting real-time data simulation...');
  
  const dataSourceConnection = streamEngine.getConnection(connections[0]!)!;
  let messageCounter = 0;

  // Simulate different data patterns
  const patterns = ['sine-wave', 'random', 'burst', 'steady'];
  let currentPattern = 0;

  const dataSimulation = setInterval(async () => {
    const pattern = patterns[currentPattern % patterns.length];
    let messageCount = 1;
    
    switch (pattern) {
      case 'sine-wave':
        messageCount = Math.floor(Math.sin(Date.now() / 1000) * 10) + 15;
        break;
      case 'random':
        messageCount = Math.floor(Math.random() * 20) + 5;
        break;
      case 'burst':
        messageCount = Math.random() > 0.8 ? 50 : 2;
        break;
      case 'steady':
        messageCount = 10;
        break;
    }

    // Send batch of messages
    for (let i = 0; i < messageCount; i++) {
      try {
        await dataSourceConnection.writer.write({
          id: `msg-${messageCounter++}`,
          timestamp: Date.now(),
          sourceNodeId: 'dataSource',
          targetNodeId: 'processor',
          port: 'output',
          data: {
            value: Math.sin(Date.now() / 1000) * 100 + Math.random() * 20,
            pattern,
            sequence: messageCounter
          },
          metadata: { pattern, batchSize: messageCount }
        });
      } catch (error) {
        console.warn(`Failed to send message: ${error}`);
      }
    }

    // Switch pattern every 10 seconds
    if (messageCounter % 100 === 0) {
      currentPattern++;
      console.log(`   Switched to pattern: ${patterns[currentPattern % patterns.length]}`);
    }
  }, 100); // 10 messages per second base rate

  // 4. Monitor metrics in real-time
  console.log('4. Monitoring stream metrics...');
  
  const metricsDisplay = setInterval(() => {
    console.clear();
    console.log('🚀 Node Flow Streaming Engine Demo - Real-time Metrics\n');
    
    let snapshot: any = null;
    streamDebugger.snapshots$.subscribe(s => snapshot = s).unsubscribe();
    if (snapshot) {
      console.log(`System Overview (${new Date().toLocaleTimeString()}):`);
      console.log(`  Total Connections: ${snapshot.systemMetrics.totalConnections}`);
      console.log(`  Messages/sec: ${snapshot.systemMetrics.totalMessages.toFixed(1)}`);
      console.log(`  Avg Latency: ${snapshot.systemMetrics.averageLatency.toFixed(1)}ms`);
      console.log(`  System Load: ${(snapshot.systemMetrics.systemLoad * 100).toFixed(1)}%\n`);

      console.log('Connection Details:');
      snapshot.connections.forEach((conn: any) => {
        const status = conn.isActive ? '🟢 Active' : '🔴 Inactive';
        console.log(`  ${conn.id}: ${status}`);
        console.log(`    Messages/sec: ${conn.metrics.messagesPerSecond.toFixed(1)}`);
        console.log(`    Latency: ${conn.metrics.averageLatency.toFixed(1)}ms`);
        console.log(`    Buffer: ${(conn.metrics.bufferUtilization * 100).toFixed(1)}%`);
        console.log(`    Errors: ${(conn.metrics.errorRate * 100).toFixed(2)}%`);
        if (conn.metrics.backpressureEvents > 0) {
          console.log(`    ⚠️  Backpressure events: ${conn.metrics.backpressureEvents}`);
        }
        console.log();
      });
    }

    console.log(`Total messages sent: ${messageCounter}`);
    console.log('\nPress Ctrl+C to run performance tests...');
  }, 1000);

  // 5. Handle graceful shutdown and performance testing
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down streaming demo...');
    
    clearInterval(dataSimulation);
    clearInterval(metricsDisplay);
    
    console.log('\n📊 Running performance tests...');
    
    const testSuite = new PerformanceTestSuite(streamEngine);
    
    try {
      // Run a subset of performance tests
      const quickTests = STANDARD_PERFORMANCE_TESTS.slice(0, 3).map(test => ({
        ...test,
        duration: Math.min(test.duration, 10000) // Limit to 10 seconds for demo
      }));

      await testSuite.runTestSuite(quickTests);
      
      console.log('\n📈 Performance Test Results:');
      console.log(testSuite.generateReport());
      
    } catch (error) {
      console.error('Performance tests failed:', error);
    }

    // Export debug data
    console.log('\n💾 Exporting debug data...');
    const debugData = streamDebugger.exportDebugData();
    console.log(`Captured ${debugData.events.length} debug events`);
    console.log(`Recording duration: ${(debugData.metadata.recordingDuration / 1000).toFixed(1)}s`);

    // Cleanup
    streamDebugger.stopRecording();
    streamEngine.destroy();
    
    console.log('\n✅ Demo completed successfully!');
    process.exit(0);
  });

  // Start the demo
  console.log('\n▶️  Demo is running! Watch the real-time metrics above.');
  console.log('   Different data patterns will be simulated automatically.');
  console.log('   Press Ctrl+C to stop and run performance tests.\n');
}

// Self-executing demo
if (require.main === module) {
  runStreamingDemo().catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}

export { runStreamingDemo };

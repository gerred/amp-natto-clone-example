import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo, useRef, useEffect } from 'react';
import { useLogStream } from '../hooks/useStreamData';
export function StreamingLogs({ id, title = 'Streaming Logs', streamId, maxLogs = 1000, updateInterval = 50, // Fast updates for logs
showMetrics = false, autoScroll = true, defaultLogLevel = 'info', config }) {
    const { filteredLogs, isConnected, error, metrics, logLevels, setLogLevel } = useLogStream(streamId || id, {
        maxLogs,
        updateInterval,
        logLevel: defaultLogLevel,
        enableBackpressure: true
    });
    const logsContainerRef = useRef(null);
    const [selectedLevel, setSelectedLevel] = React.useState(defaultLogLevel);
    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (autoScroll && logsContainerRef.current) {
            logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
        }
    }, [filteredLogs, autoScroll]);
    const handleLogLevelChange = (level) => {
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
        if (error)
            return 'error';
        if (!isConnected)
            return 'disconnected';
        return 'connected';
    }, [isConnected, error]);
    const statusColor = {
        connected: '#4CAF50',
        disconnected: '#FF9800',
        error: '#F44336'
    }[connectionStatus];
    return (_jsxs("div", { className: "streaming-logs", style: {
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#fff',
            height: '400px',
            display: 'flex',
            flexDirection: 'column'
        }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    borderBottom: '1px solid #eee'
                }, children: [_jsx("h3", { style: { margin: 0, fontSize: '16px', fontWeight: 'bold' }, children: title }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '16px' }, children: [_jsx("div", { style: { display: 'flex', gap: '4px' }, children: logLevels.map(level => (_jsx("button", { onClick: () => handleLogLevelChange(level), style: {
                                        padding: '4px 8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: selectedLevel === level ? 'bold' : 'normal',
                                        backgroundColor: selectedLevel === level ? logLevelBgColors[level] : '#fff',
                                        color: selectedLevel === level ? logLevelColors[level] : '#666',
                                        cursor: 'pointer'
                                    }, children: level.toUpperCase() }, level))) }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("div", { style: {
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            backgroundColor: statusColor
                                        } }), _jsx("span", { style: { fontSize: '12px', color: '#666' }, children: connectionStatus })] })] })] }), error ? (_jsxs("div", { style: {
                    color: '#F44336',
                    padding: '16px',
                    backgroundColor: '#FFEBEE',
                    margin: '16px',
                    borderRadius: '4px',
                    fontSize: '14px'
                }, children: ["Error: ", error.message] })) : (_jsxs("div", { ref: logsContainerRef, style: {
                    flex: 1,
                    overflowY: 'auto',
                    padding: '8px 0',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    lineHeight: '1.4'
                }, children: [filteredLogs.map((log, index) => {
                        const logData = log.value;
                        return (_jsxs("div", { style: {
                                padding: '4px 16px',
                                borderLeft: `3px solid ${logLevelColors[logData.level]}`,
                                backgroundColor: index % 2 === 0 ? '#fff' : '#FAFAFA',
                                display: 'flex',
                                gap: '12px'
                            }, children: [_jsx("span", { style: {
                                        color: '#666',
                                        fontSize: '11px',
                                        whiteSpace: 'nowrap',
                                        minWidth: '80px'
                                    }, children: new Date(log.timestamp).toLocaleTimeString() }), _jsx("span", { style: {
                                        color: logLevelColors[logData.level],
                                        fontWeight: 'bold',
                                        minWidth: '50px',
                                        textTransform: 'uppercase'
                                    }, children: logData.level }), _jsxs("span", { style: { flex: 1 }, children: [logData.message, logData.details && (_jsxs("details", { style: { marginTop: '4px' }, children: [_jsx("summary", { style: {
                                                        cursor: 'pointer',
                                                        color: '#666',
                                                        fontSize: '12px'
                                                    }, children: "Details" }), _jsx("pre", { style: {
                                                        marginTop: '4px',
                                                        padding: '8px',
                                                        backgroundColor: '#F5F5F5',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        overflow: 'auto'
                                                    }, children: JSON.stringify(logData.details, null, 2) })] }))] })] }, `${log.timestamp}-${index}`));
                    }), filteredLogs.length === 0 && (_jsxs("div", { style: {
                            padding: '32px 16px',
                            textAlign: 'center',
                            color: '#666',
                            fontStyle: 'italic'
                        }, children: ["No logs at ", selectedLevel, " level or above"] }))] })), showMetrics && (_jsxs("div", { style: {
                    padding: '12px 16px',
                    backgroundColor: '#F5F5F5',
                    borderTop: '1px solid #eee',
                    fontSize: '12px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                    gap: '8px'
                }, children: [_jsxs("div", { children: [_jsx("strong", { children: "Total Messages:" }), " ", metrics.messageCount] }), _jsxs("div", { children: [_jsx("strong", { children: "Latency:" }), " ", metrics.averageLatency.toFixed(1), "ms"] }), _jsxs("div", { children: [_jsx("strong", { children: "Filtered Logs:" }), " ", filteredLogs.length] }), _jsxs("div", { children: [_jsx("strong", { children: "Level:" }), " ", selectedLevel.toUpperCase(), "+"] })] }))] }));
}

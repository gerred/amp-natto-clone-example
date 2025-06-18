import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useRef, useEffect } from 'react';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
export const WidgetContainer = ({ id, title, children, toolbar, footer, resizable = false, collapsible = false, minimizable = false, dragHandle = false, loading = false, error, className = '', style = {}, onResize, onMove, onCollapse, onMinimize, onEvent, maxWidth, maxHeight, minWidth = 200, minHeight = 100, aspectRatio, theme = 'auto', elevation = 1, borderRadius = 8, showPerformanceMetrics = false, ...props }) => {
    const containerRef = useRef(null);
    const headerRef = useRef(null);
    const { metrics, isMonitoring } = usePerformanceMonitor(id);
    // State management
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [size, setSize] = useState({ width: 400, height: 300 });
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [resizeHandle, setResizeHandle] = useState(null);
    // Drag and drop state
    const dragStartRef = useRef(null);
    const resizeStartRef = useRef(null);
    // Handle collapse
    const handleCollapse = useCallback(() => {
        const newCollapsed = !isCollapsed;
        setIsCollapsed(newCollapsed);
        if (onCollapse) {
            onCollapse(newCollapsed);
        }
        if (onEvent) {
            onEvent({
                type: 'custom',
                source: { id },
                data: { action: 'collapse', collapsed: newCollapsed },
                timestamp: Date.now(),
                propagate: false
            });
        }
    }, [isCollapsed, onCollapse, onEvent, id]);
    // Handle minimize
    const handleMinimize = useCallback(() => {
        const newMinimized = !isMinimized;
        setIsMinimized(newMinimized);
        if (onMinimize) {
            onMinimize(newMinimized);
        }
        if (onEvent) {
            onEvent({
                type: 'custom',
                source: { id },
                data: { action: 'minimize', minimized: newMinimized },
                timestamp: Date.now(),
                propagate: false
            });
        }
    }, [isMinimized, onMinimize, onEvent, id]);
    // Handle drag start
    const handleDragStart = useCallback((e) => {
        if (!dragHandle)
            return;
        setIsDragging(true);
        dragStartRef.current = {
            x: position.x,
            y: position.y,
            startX: e.clientX,
            startY: e.clientY
        };
        e.preventDefault();
    }, [dragHandle, position]);
    // Handle resize start
    const handleResizeStart = useCallback((e, handle) => {
        if (!resizable)
            return;
        setIsResizing(true);
        setResizeHandle(handle);
        resizeStartRef.current = {
            width: size.width,
            height: size.height,
            x: position.x,
            y: position.y,
            startX: e.clientX,
            startY: e.clientY
        };
        e.preventDefault();
        e.stopPropagation();
    }, [resizable, size, position]);
    // Mouse move handler
    const handleMouseMove = useCallback((e) => {
        if (isDragging && dragStartRef.current) {
            const deltaX = e.clientX - dragStartRef.current.startX;
            const deltaY = e.clientY - dragStartRef.current.startY;
            const newPosition = {
                x: dragStartRef.current.x + deltaX,
                y: dragStartRef.current.y + deltaY
            };
            setPosition(newPosition);
            if (onMove) {
                onMove(newPosition);
            }
        }
        if (isResizing && resizeStartRef.current && resizeHandle) {
            const deltaX = e.clientX - resizeStartRef.current.startX;
            const deltaY = e.clientY - resizeStartRef.current.startY;
            let newWidth = resizeStartRef.current.width;
            let newHeight = resizeStartRef.current.height;
            let newX = resizeStartRef.current.x;
            let newY = resizeStartRef.current.y;
            // Handle different resize directions
            if (resizeHandle.includes('e')) {
                newWidth = Math.max(minWidth, resizeStartRef.current.width + deltaX);
                if (maxWidth)
                    newWidth = Math.min(maxWidth, newWidth);
            }
            if (resizeHandle.includes('w')) {
                newWidth = Math.max(minWidth, resizeStartRef.current.width - deltaX);
                if (maxWidth)
                    newWidth = Math.min(maxWidth, newWidth);
                newX = resizeStartRef.current.x + deltaX;
            }
            if (resizeHandle.includes('s')) {
                newHeight = Math.max(minHeight, resizeStartRef.current.height + deltaY);
                if (maxHeight)
                    newHeight = Math.min(maxHeight, newHeight);
            }
            if (resizeHandle.includes('n')) {
                newHeight = Math.max(minHeight, resizeStartRef.current.height - deltaY);
                if (maxHeight)
                    newHeight = Math.min(maxHeight, newHeight);
                newY = resizeStartRef.current.y + deltaY;
            }
            // Maintain aspect ratio if specified
            if (aspectRatio) {
                if (resizeHandle.includes('e') || resizeHandle.includes('w')) {
                    newHeight = newWidth / aspectRatio;
                }
                else {
                    newWidth = newHeight * aspectRatio;
                }
            }
            const newSize = { width: newWidth, height: newHeight };
            const newPosition = { x: newX, y: newY };
            setSize(newSize);
            setPosition(newPosition);
            if (onResize) {
                onResize(newSize);
            }
            if (onMove && (newX !== position.x || newY !== position.y)) {
                onMove(newPosition);
            }
        }
    }, [isDragging, isResizing, resizeHandle, onMove, onResize, minWidth, minHeight, maxWidth, maxHeight, aspectRatio, position]);
    // Mouse up handler
    const handleMouseUp = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            dragStartRef.current = null;
        }
        if (isResizing) {
            setIsResizing(false);
            setResizeHandle(null);
            resizeStartRef.current = null;
        }
    }, [isDragging, isResizing]);
    // Add global mouse event listeners
    useEffect(() => {
        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);
    // Theme detection
    const effectiveTheme = theme === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
    // Container styles
    const containerStyles = {
        position: 'relative',
        width: size.width,
        height: isCollapsed ? 'auto' : size.height,
        minWidth,
        minHeight: isCollapsed ? 'auto' : minHeight,
        maxWidth,
        maxHeight: isCollapsed ? 'auto' : maxHeight,
        transform: dragHandle ? `translate(${position.x}px, ${position.y}px)` : undefined,
        borderRadius,
        boxShadow: `0 ${elevation * 2}px ${elevation * 4}px rgba(0, 0, 0, ${effectiveTheme === 'dark' ? 0.3 : 0.1})`,
        backgroundColor: effectiveTheme === 'dark' ? '#1a1a1a' : '#ffffff',
        border: `1px solid ${effectiveTheme === 'dark' ? '#333' : '#e0e0e0'}`,
        color: effectiveTheme === 'dark' ? '#ffffff' : '#000000',
        ...style
    };
    // Error display
    if (error) {
        return (_jsxs("div", { className: `widget-container error ${className}`, style: containerStyles, children: [_jsx("div", { className: "widget-header", children: _jsx("h3", { className: "widget-title", children: "Error" }) }), _jsx("div", { className: "widget-content error-content", children: _jsx("div", { className: "error-message", children: typeof error === 'string' ? error : error.message }) })] }));
    }
    // Loading display
    if (loading) {
        return (_jsxs("div", { className: `widget-container loading ${className}`, style: containerStyles, children: [_jsx("div", { className: "widget-header", children: _jsx("h3", { className: "widget-title", children: title || 'Loading...' }) }), _jsx("div", { className: "widget-content loading-content", children: _jsx("div", { className: "loading-spinner", children: _jsx("div", { className: "spinner" }) }) })] }));
    }
    // Render resize handles
    const renderResizeHandles = () => {
        if (!resizable || isMinimized)
            return null;
        const handles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
        return handles.map(handle => (_jsx("div", { className: `resize-handle resize-${handle}`, onMouseDown: (e) => handleResizeStart(e, handle), style: {
                position: 'absolute',
                ...getResizeHandleStyles(handle)
            } }, handle)));
    };
    return (_jsxs("div", { ref: containerRef, className: `widget-container ${effectiveTheme} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${className}`, style: containerStyles, ...props, children: [_jsxs("div", { ref: headerRef, className: `widget-header ${dragHandle ? 'draggable' : ''}`, onMouseDown: dragHandle ? handleDragStart : undefined, style: { cursor: dragHandle ? 'move' : 'default' }, children: [_jsx("h3", { className: "widget-title", children: title }), _jsxs("div", { className: "widget-controls", children: [toolbar, showPerformanceMetrics && metrics && (_jsxs("div", { className: "performance-metrics", children: [metrics.fps && _jsx("span", { title: "FPS", children: metrics.fps.toFixed(1) }), metrics.memoryUsage && (_jsxs("span", { title: "Memory", children: [(metrics.memoryUsage / 1024 / 1024).toFixed(1), "MB"] }))] })), collapsible && (_jsx("button", { className: "control-button collapse-button", onClick: handleCollapse, title: isCollapsed ? 'Expand' : 'Collapse', children: isCollapsed ? '▼' : '▲' })), minimizable && (_jsx("button", { className: "control-button minimize-button", onClick: handleMinimize, title: isMinimized ? 'Restore' : 'Minimize', children: isMinimized ? '□' : '—' }))] })] }), !isCollapsed && !isMinimized && (_jsx("div", { className: "widget-content", children: children })), footer && !isCollapsed && !isMinimized && (_jsx("div", { className: "widget-footer", children: footer })), renderResizeHandles()] }));
};
// Helper function for resize handle styles
function getResizeHandleStyles(handle) {
    const size = 8;
    const offset = -size / 2;
    const styles = {
        width: size,
        height: size,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        borderRadius: '50%',
        cursor: `${handle}-resize`
    };
    // Position based on handle direction
    if (handle.includes('n'))
        styles.top = offset;
    if (handle.includes('s'))
        styles.bottom = offset;
    if (handle.includes('e'))
        styles.right = offset;
    if (handle.includes('w'))
        styles.left = offset;
    // Corner handles
    if (handle === 'ne' || handle === 'nw')
        styles.top = offset;
    if (handle === 'se' || handle === 'sw')
        styles.bottom = offset;
    if (handle === 'ne' || handle === 'se')
        styles.right = offset;
    if (handle === 'nw' || handle === 'sw')
        styles.left = offset;
    // Edge handles
    if (handle === 'n' || handle === 's') {
        styles.left = '50%';
        styles.marginLeft = offset;
    }
    if (handle === 'e' || handle === 'w') {
        styles.top = '50%';
        styles.marginTop = offset;
    }
    return styles;
}
export default WidgetContainer;

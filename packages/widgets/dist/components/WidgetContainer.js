import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function WidgetContainer({ id, title, children, onClose, onSettings, }) {
    return (_jsxs("div", { className: "widget-container", "data-widget-id": id, children: [_jsxs("div", { className: "widget-header", children: [_jsx("h3", { className: "widget-title", children: title || 'Widget' }), _jsxs("div", { className: "widget-controls", children: [onSettings && (_jsx("button", { onClick: onSettings, className: "widget-btn", title: "Settings", children: "\u2699\uFE0F" })), onClose && (_jsx("button", { onClick: onClose, className: "widget-btn", title: "Close", children: "\u2715" }))] })] }), _jsx("div", { className: "widget-content", children: children })] }));
}

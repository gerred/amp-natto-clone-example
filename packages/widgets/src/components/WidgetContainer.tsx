import React from 'react';
import type { WidgetProps } from '../types';

interface WidgetContainerProps extends WidgetProps {
  children: React.ReactNode;
  onClose?: () => void;
  onSettings?: () => void;
}

export function WidgetContainer({
  id,
  title,
  children,
  onClose,
  onSettings,
}: WidgetContainerProps) {
  return (
    <div className="widget-container" data-widget-id={id}>
      <div className="widget-header">
        <h3 className="widget-title">{title || 'Widget'}</h3>
        <div className="widget-controls">
          {onSettings && (
            <button onClick={onSettings} className="widget-btn" title="Settings">
              ⚙️
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="widget-btn" title="Close">
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="widget-content">{children}</div>
    </div>
  );
}

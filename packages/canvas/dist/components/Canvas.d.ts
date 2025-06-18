import React from 'react';
import { Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { FlowNodeData } from '../types';
import './Canvas.css';
interface CanvasProps {
    className?: string;
    showLibrary?: boolean;
    onNodeClick?: (event: React.MouseEvent, node: Node<FlowNodeData>) => void;
    onEdgeClick?: (event: React.MouseEvent, edge: Edge) => void;
}
export declare const Canvas: React.FC<CanvasProps>;
export {};

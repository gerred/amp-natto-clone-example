import React from 'react';
import type { NodePort as NodePortType } from '../../types';
import './NodePort.css';
interface NodePortProps {
    port: NodePortType;
    type: 'input' | 'output';
}
export declare const NodePort: React.FC<NodePortProps>;
export {};

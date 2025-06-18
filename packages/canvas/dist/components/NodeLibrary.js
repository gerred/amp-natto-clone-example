import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useFlowStore } from '../store/flow-store';
import './NodeLibrary.css';
const categoryIcons = {
    input: '📥',
    transform: '⚙️',
    output: '📤',
    ai: '🤖',
    http: '🌐',
    filter: '🔍',
    merge: '🔀',
};
const categoryLabels = {
    input: 'Input',
    transform: 'Transform',
    output: 'Output',
    ai: 'AI/LLM',
    http: 'HTTP',
    filter: 'Filter',
    merge: 'Merge',
};
const NodeLibraryItem = ({ definition, onDragStart }) => {
    return (_jsxs("div", { className: "node-library-item", draggable: true, onDragStart: (event) => onDragStart(event, definition.type), title: definition.description, children: [_jsx("div", { className: "node-library-item-icon", children: definition.icon || categoryIcons[definition.category] || '📦' }), _jsxs("div", { className: "node-library-item-content", children: [_jsx("div", { className: "node-library-item-label", children: definition.label }), _jsx("div", { className: "node-library-item-description", children: definition.description })] })] }));
};
export const NodeLibrary = () => {
    const { definitions, categories, searchTerm, selectedCategory, setSearchTerm, setSelectedCategory, setDraggedNodeType, } = useFlowStore();
    const filteredDefinitions = useMemo(() => {
        let filtered = [...definitions];
        // Filter by category
        if (selectedCategory) {
            filtered = filtered.filter((def) => def.category === selectedCategory);
        }
        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter((def) => def.label.toLowerCase().includes(term) ||
                def.description.toLowerCase().includes(term) ||
                def.type.toLowerCase().includes(term));
        }
        return filtered;
    }, [definitions, selectedCategory, searchTerm]);
    const groupedDefinitions = useMemo(() => {
        const grouped = {};
        filteredDefinitions.forEach((def) => {
            if (!grouped[def.category]) {
                grouped[def.category] = [];
            }
            grouped[def.category].push(def);
        });
        return grouped;
    }, [filteredDefinitions]);
    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
        setDraggedNodeType(nodeType);
    };
    const onDragEnd = () => {
        setDraggedNodeType(null);
    };
    return (_jsxs("div", { className: "node-library", onDragEnd: onDragEnd, children: [_jsxs("div", { className: "node-library-header", children: [_jsx("h3", { children: "Node Library" }), _jsx("div", { className: "node-library-search", children: _jsx("input", { type: "text", placeholder: "Search nodes...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "node-library-search-input" }) })] }), _jsxs("div", { className: "node-library-categories", children: [_jsxs("button", { className: `node-library-category ${!selectedCategory ? 'active' : ''}`, onClick: () => setSelectedCategory(null), children: ["All (", definitions.length, ")"] }), categories.map((category) => {
                        const count = definitions.filter((def) => def.category === category).length;
                        return (_jsxs("button", { className: `node-library-category ${selectedCategory === category ? 'active' : ''}`, onClick: () => setSelectedCategory(category), children: [_jsx("span", { className: "node-library-category-icon", children: categoryIcons[category] || '📦' }), _jsx("span", { className: "node-library-category-label", children: categoryLabels[category] || category }), _jsxs("span", { className: "node-library-category-count", children: ["(", count, ")"] })] }, category));
                    })] }), _jsx("div", { className: "node-library-content", children: Object.keys(groupedDefinitions).length === 0 ? (_jsx("div", { className: "node-library-empty", children: searchTerm ? 'No nodes match your search' : 'No nodes available' })) : (Object.entries(groupedDefinitions).map(([category, nodes]) => (_jsxs("div", { className: "node-library-section", children: [!selectedCategory && (_jsxs("h4", { className: "node-library-section-title", children: [_jsx("span", { className: "node-library-section-icon", children: categoryIcons[category] || '📦' }), categoryLabels[category] || category] })), _jsx("div", { className: "node-library-items", children: nodes.map((definition) => (_jsx(NodeLibraryItem, { definition: definition, onDragStart: onDragStart }, definition.type))) })] }, category)))) })] }));
};

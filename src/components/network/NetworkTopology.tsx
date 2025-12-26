import { useMemo, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { NetworkDeviceNode } from './NetworkDeviceNode';

interface NetworkDevice {
  id: string;
  device_name: string;
  ip_address: string;
  type: string;
  status: string;
  uplink_device_id: string | null;
}

interface NetworkTopologyProps {
  devices: NetworkDevice[];
}

export interface NetworkTopologyHandle {
  enablePrintMode: () => void;
  disablePrintMode: () => void;
}

const nodeTypes = {
  networkDevice: NetworkDeviceNode,
};

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 80 });

  const nodeWidth = 200;
  const nodeHeight = 80;

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export const NetworkTopology = forwardRef<NetworkTopologyHandle, NetworkTopologyProps>(
  ({ devices }, ref) => {
    const [isPrintMode, setIsPrintMode] = useState(false);

    useImperativeHandle(ref, () => ({
      enablePrintMode: () => setIsPrintMode(true),
      disablePrintMode: () => setIsPrintMode(false),
    }));

    const { layoutedNodes, layoutedEdges } = useMemo(() => {
      const nodes: Node[] = devices.map((device) => ({
        id: device.id,
        type: 'networkDevice',
        position: { x: 0, y: 0 },
        data: {
          label: device.device_name,
          ip: device.ip_address,
          type: device.type,
          status: device.status,
          isPrintMode,
        },
      }));

      const edges: Edge[] = devices
        .filter((device) => device.uplink_device_id)
        .map((device) => ({
          id: `${device.uplink_device_id}-${device.id}`,
          source: device.uplink_device_id!,
          target: device.id,
          animated: !isPrintMode && device.status === 'Online',
          style: { 
            stroke: isPrintMode 
              ? '#1f2937' 
              : device.status === 'Online' 
                ? 'hsl(var(--primary))' 
                : 'hsl(var(--muted-foreground))',
            strokeWidth: isPrintMode ? 2.5 : 2,
          },
        }));

      const result = getLayoutedElements(nodes, edges);
      return { layoutedNodes: result.nodes, layoutedEdges: result.edges };
    }, [devices, isPrintMode]);

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

    return (
      <div 
        className={`w-full h-[600px] overflow-hidden rounded-xl border ${
          isPrintMode 
            ? 'bg-white border-gray-300' 
            : 'glass-card'
        }`}
        data-print-mode={isPrintMode}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background 
            color={isPrintMode ? '#d1d5db' : 'hsl(var(--muted-foreground))'} 
            gap={20} 
            size={1} 
          />
          {!isPrintMode && (
            <>
              <Controls className="!bg-card !border-border !rounded-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted" />
              <MiniMap 
                className="!bg-card !border-border !rounded-lg"
                nodeColor={(node) => {
                  const status = node.data?.status;
                  if (status === 'Online') return 'hsl(var(--success))';
                  if (status === 'Offline') return 'hsl(var(--destructive))';
                  return 'hsl(var(--warning))';
                }}
              />
            </>
          )}
        </ReactFlow>
      </div>
    );
  }
);

NetworkTopology.displayName = 'NetworkTopology';

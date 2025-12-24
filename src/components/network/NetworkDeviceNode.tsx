import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Router, Network, Wifi, Server, Camera, Monitor } from 'lucide-react';

interface NetworkDeviceNodeProps {
  data: {
    label: string;
    ip: string;
    type: string;
    status: string;
  };
}

const deviceIcons: Record<string, any> = {
  Router: Router,
  Switch: Network,
  AP: Wifi,
  Server: Server,
  Camera: Camera,
  Workstation: Monitor,
};

const deviceColors: Record<string, string> = {
  Router: 'bg-red-500/20 border-red-500/50 text-red-400',
  Switch: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
  AP: 'bg-green-500/20 border-green-500/50 text-green-400',
  Server: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
  Camera: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
  Workstation: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400',
};

const statusColors: Record<string, string> = {
  Online: 'bg-success',
  Offline: 'bg-destructive',
  Maintenance: 'bg-warning',
};

export const NetworkDeviceNode = memo(({ data }: NetworkDeviceNodeProps) => {
  const DeviceIcon = deviceIcons[data.type] || Monitor;
  const colorClass = deviceColors[data.type] || deviceColors.Workstation;
  const statusClass = statusColors[data.status] || statusColors.Offline;

  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${colorClass} min-w-[180px] backdrop-blur-sm`}>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary !border-primary-foreground !w-3 !h-3"
      />
      
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-background/50">
          <DeviceIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground truncate text-sm">
              {data.label}
            </span>
            <span className={`w-2 h-2 rounded-full ${statusClass} shrink-0`} />
          </div>
          <span className="text-xs font-mono text-muted-foreground">{data.ip}</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !border-primary-foreground !w-3 !h-3"
      />
    </div>
  );
});

NetworkDeviceNode.displayName = 'NetworkDeviceNode';

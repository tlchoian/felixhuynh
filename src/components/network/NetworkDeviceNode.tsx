import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Router, Network, Wifi, Server, Camera, Monitor, Tv } from 'lucide-react';

interface NetworkDeviceNodeProps {
  data: {
    label: string;
    ip: string;
    type: string;
    status: string;
    isPrintMode?: boolean;
  };
}

const deviceIcons: Record<string, any> = {
  Router: Router,
  Switch: Network,
  AP: Wifi,
  Server: Server,
  Camera: Camera,
  Workstation: Monitor,
  IPTV: Tv,
};

const deviceColors: Record<string, string> = {
  Router: 'bg-red-500/20 border-red-500/50 text-red-400',
  Switch: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
  AP: 'bg-green-500/20 border-green-500/50 text-green-400',
  Server: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
  Camera: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
  Workstation: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400',
  IPTV: 'bg-pink-500/20 border-pink-500/50 text-pink-400',
};

// Print-friendly colors with solid backgrounds
const devicePrintColors: Record<string, string> = {
  Router: 'bg-red-100 border-red-600 text-red-800',
  Switch: 'bg-blue-100 border-blue-600 text-blue-800',
  AP: 'bg-green-100 border-green-600 text-green-800',
  Server: 'bg-purple-100 border-purple-600 text-purple-800',
  Camera: 'bg-orange-100 border-orange-600 text-orange-800',
  Workstation: 'bg-cyan-100 border-cyan-600 text-cyan-800',
  IPTV: 'bg-pink-100 border-pink-600 text-pink-800',
};

const statusColors: Record<string, string> = {
  Online: 'bg-success',
  Offline: 'bg-destructive',
  Maintenance: 'bg-warning',
};

const statusPrintColors: Record<string, string> = {
  Online: 'bg-green-600',
  Offline: 'bg-red-600',
  Maintenance: 'bg-yellow-500',
};

export const NetworkDeviceNode = memo(({ data }: NetworkDeviceNodeProps) => {
  const DeviceIcon = deviceIcons[data.type] || Monitor;
  const isPrint = data.isPrintMode;
  const colorClass = isPrint 
    ? (devicePrintColors[data.type] || devicePrintColors.Workstation)
    : (deviceColors[data.type] || deviceColors.Workstation);
  const statusClass = isPrint
    ? (statusPrintColors[data.status] || statusPrintColors.Offline)
    : (statusColors[data.status] || statusColors.Offline);

  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${colorClass} min-w-[180px] ${isPrint ? '' : 'backdrop-blur-sm'}`}>
      <Handle
        type="target"
        position={Position.Top}
        className={isPrint ? '!bg-gray-700 !border-gray-800 !w-3 !h-3' : '!bg-primary !border-primary-foreground !w-3 !h-3'}
      />
      
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isPrint ? 'bg-white' : 'bg-background/50'}`}>
          <DeviceIcon className={`w-5 h-5 ${isPrint ? 'text-gray-800' : ''}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-semibold truncate text-sm ${isPrint ? 'text-gray-900' : 'text-foreground'}`}>
              {data.label}
            </span>
            <span className={`w-2 h-2 rounded-full ${statusClass} shrink-0`} />
          </div>
          <span className={`text-xs font-mono ${isPrint ? 'text-gray-700' : 'text-muted-foreground'}`}>{data.ip}</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className={isPrint ? '!bg-gray-700 !border-gray-800 !w-3 !h-3' : '!bg-primary !border-primary-foreground !w-3 !h-3'}
      />
    </div>
  );
});

NetworkDeviceNode.displayName = 'NetworkDeviceNode';

import React from 'react';
import { Activity, CheckCircle, AlertTriangle, HelpCircle, XCircle, RefreshCw } from 'lucide-react';

const StatusCard = ({ app }) => {
    const syncStatus = app.status.sync.status;
    const healthStatus = app.status.health.status;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Synced':
            case 'Healthy':
                return 'text-green-500';
            case 'OutOfSync':
            case 'Degraded':
                return 'text-red-500';
            case 'Unknown':
            case 'Missing':
                return 'text-gray-400';
            case 'Progressing':
                return 'text-blue-500';
            default:
                return 'text-gray-400';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Synced':
            case 'Healthy':
                return <CheckCircle className="w-5 h-5" />;
            case 'OutOfSync':
                return <RefreshCw className="w-5 h-5" />;
            case 'Degraded':
                return <XCircle className="w-5 h-5" />;
            case 'Unknown':
            case 'Missing':
                return <HelpCircle className="w-5 h-5" />;
            default:
                return <Activity className="w-5 h-5" />;
        }
    };

    const isIssue = syncStatus !== 'Synced' || healthStatus !== 'Healthy';

    return (
        <div className={`
      relative overflow-hidden rounded-xl p-4 mb-3 transition-all duration-300
      bg-opacity-20 backdrop-filter backdrop-blur-lg border border-opacity-10
      ${isIssue ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}
    `}>
            <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg truncate pr-4 text-white">
                    {app.metadata.name}
                </h3>

                {isIssue && (
                    <div className="animate-pulse">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                    </div>
                )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                    <span className={getStatusColor(syncStatus)}>
                        {getStatusIcon(syncStatus)}
                    </span>
                    <span className="text-gray-300">Sync:</span>
                    <span className={`font-medium ${getStatusColor(syncStatus)}`}>{syncStatus}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={getStatusColor(healthStatus)}>
                        {getStatusIcon(healthStatus)}
                    </span>
                    <span className="text-gray-300">Health:</span>
                    <span className={`font-medium ${getStatusColor(healthStatus)}`}>{healthStatus}</span>
                </div>
            </div>
        </div>
    );
};

export default StatusCard;

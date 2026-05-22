import React, { useEffect, useState, useMemo } from 'react';
import { fetchApplications } from '../services/argocd';
import StatusCard from './StatusCard';
import { Search, Filter } from 'lucide-react';

const Dashboard = () => {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, issues, unknown
    const [search, setSearch] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchApplications();
                setApps(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();

        // Poll every 30 seconds
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredApps = useMemo(() => {
        return apps.filter(app => {
            const matchesSearch = app.metadata.name.toLowerCase().includes(search.toLowerCase());

            if (!matchesSearch) return false;

            if (filter === 'issues') {
                return app.status.sync.status !== 'Synced' || app.status.health.status !== 'Healthy';
            }
            if (filter === 'unknown') {
                return app.status.sync.status === 'Unknown' || app.status.health.status === 'Missing';
            }

            return true;
        }).sort((a, b) => {
            // Sort issues to top
            const aIssue = a.status.sync.status !== 'Synced' || a.status.health.status !== 'Healthy';
            const bIssue = b.status.sync.status !== 'Synced' || b.status.health.status !== 'Healthy';
            if (aIssue && !bIssue) return -1;
            if (!aIssue && bIssue) return 1;
            return a.metadata.name.localeCompare(b.metadata.name);
        });
    }, [apps, filter, search]);

    if (loading) return <div className="p-8 text-center">Loading ArgoCD Apps...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="p-4 max-w-md mx-auto md:max-w-4xl">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                    ArgoCD Mobile
                </h1>
                <div className="text-xs text-slate-400">
                    {apps.length} Apps
                </div>
            </header>

            {/* Search & Filter */}
            <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md py-4 -mx-4 px-4 mb-4 border-b border-slate-800">
                <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full bg-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                        All Apps
                    </button>
                    <button
                        onClick={() => setFilter('issues')}
                        className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${filter === 'issues' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                        Issues
                    </button>
                    <button
                        onClick={() => setFilter('unknown')}
                        className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${filter === 'unknown' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                        Unknown
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredApps.map(app => (
                    <StatusCard key={app.metadata.name} app={app} />
                ))}
            </div>

            {filteredApps.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                    No apps found matching criteria
                </div>
            )}
        </div>
    );
};

export default Dashboard;

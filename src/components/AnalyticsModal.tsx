import React, { useState, useMemo } from 'react';
import { ScanEvent } from '../types';
import { 
  BarChart3, 
  X, 
  Smartphone, 
  Laptop, 
  Tablet, 
  Globe, 
  Clock, 
  Download, 
  Trash2, 
  Sparkles, 
  TrendingUp, 
  UserCheck, 
  ExternalLink, 
  Activity, 
  Calendar, 
  Search,
  Filter,
  CheckCircle2,
  Share2,
  Users
} from 'lucide-react';

interface AnalyticsModalProps {
  scans: ScanEvent[];
  onClose: () => void;
  onDeleteScan?: (scanId: string) => void;
  onClearAllScans?: () => void;
  userName?: string;
}

export function AnalyticsModal({ 
  scans, 
  onClose, 
  onDeleteScan, 
  onClearAllScans,
  userName 
}: AnalyticsModalProps) {
  const [filterRange, setFilterRange] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  // Filter scans by date range
  const dateFilteredScans = useMemo(() => {
    const now = new Date().getTime();
    return scans.filter((scan) => {
      const scanTime = new Date(scan.scannedAt).getTime();
      if (filterRange === '24h') {
        return now - scanTime <= 24 * 60 * 60 * 1000;
      }
      if (filterRange === '7d') {
        return now - scanTime <= 7 * 24 * 60 * 60 * 1000;
      }
      if (filterRange === '30d') {
        return now - scanTime <= 30 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }, [scans, filterRange]);

  // Secondary filter by action & search
  const filteredScans = useMemo(() => {
    return dateFilteredScans.filter((scan) => {
      // Action filter
      if (filterAction === 'vcard' && (!scan.actionsTaken || !scan.actionsTaken.includes('downloaded_vcard'))) {
        return false;
      }
      if (filterAction === 'exchange' && (!scan.actionsTaken || !scan.actionsTaken.includes('exchanged_contact'))) {
        return false;
      }
      if (filterAction === 'links' && (!scan.actionsTaken || !scan.actionsTaken.some(a => a.startsWith('clicked_')))) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const osMatch = scan.os.toLowerCase().includes(q);
        const browserMatch = scan.browser.toLowerCase().includes(q);
        const tzMatch = scan.timezone.toLowerCase().includes(q);
        const langMatch = scan.language.toLowerCase().includes(q);
        if (!osMatch && !browserMatch && !tzMatch && !langMatch) {
          return false;
        }
      }

      return true;
    });
  }, [dateFilteredScans, filterAction, searchQuery]);

  // Aggregate Metrics & Insights
  const totalScans = dateFilteredScans.length;

  const {
    mobileCount,
    tabletCount,
    desktopCount,
    osCounts,
    browserCounts,
    vcardDownloads,
    exchangedContacts,
    linkClicks,
    dailyDistribution,
    hourlyDistribution
  } = useMemo(() => {
    let mob = 0;
    let tab = 0;
    let dsk = 0;
    let vcards = 0;
    let exch = 0;
    let links = 0;
    const osMap: Record<string, number> = {};
    const browserMap: Record<string, number> = {};
    const dayMap: Record<string, number> = {};
    const hourMap: Record<number, number> = {};

    dateFilteredScans.forEach((s) => {
      if (s.deviceType === 'mobile') mob++;
      else if (s.deviceType === 'tablet') tab++;
      else dsk++;

      // Operating System
      const osName = s.os.split(' ')[0] || s.os;
      osMap[osName] = (osMap[osName] || 0) + 1;

      // Browser
      browserMap[s.browser] = (browserMap[s.browser] || 0) + 1;

      // Actions
      if (s.actionsTaken) {
        if (s.actionsTaken.includes('downloaded_vcard')) vcards++;
        if (s.actionsTaken.includes('exchanged_contact')) exch++;
        if (s.actionsTaken.some(a => a.startsWith('clicked_'))) links++;
      }

      // Day group
      const d = new Date(s.scannedAt);
      const dateKey = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dayMap[dateKey] = (dayMap[dateKey] || 0) + 1;

      // Hour group
      const h = d.getHours();
      hourMap[h] = (hourMap[h] || 0) + 1;
    });

    return {
      mobileCount: mob,
      tabletCount: tab,
      desktopCount: dsk,
      osCounts: osMap,
      browserCounts: browserMap,
      vcardDownloads: vcards,
      exchangedContacts: exch,
      linkClicks: links,
      dailyDistribution: dayMap,
      hourlyDistribution: hourMap
    };
  }, [dateFilteredScans]);

  const topOs = Object.entries(osCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
  const conversionRate = totalScans > 0 ? Math.round(((vcardDownloads + exchangedContacts) / totalScans) * 100) : 0;

  // Format relative time helper
  const formatTimeAgo = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDay < 7) return `${diffDay}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoDate;
    }
  };

  // Export CSV helper
  const handleExportCSV = () => {
    if (scans.length === 0) return;

    const headers = [
      'Scan ID',
      'Scanned At (ISO)',
      'Device Type',
      'Operating System',
      'Browser / App',
      'Language',
      'Timezone',
      'Screen Resolution',
      'Referrer',
      'Actions Taken',
    ];

    const rows = scans.map((s) => [
      `"${s.id}"`,
      `"${s.scannedAt}"`,
      `"${s.deviceType}"`,
      `"${s.os}"`,
      `"${s.browser}"`,
      `"${s.language}"`,
      `"${s.timezone}"`,
      `"${s.screenResolution}"`,
      `"${s.referrer || ''}"`,
      `"${(s.actionsTaken || []).join(', ')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smart_networking_scan_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'tablet':
        return <Tablet className="w-4 h-4 text-sky-400" />;
      case 'desktop':
        return <Laptop className="w-4 h-4 text-indigo-400" />;
      default:
        return <Globe className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getActionBadge = (action: string) => {
    if (action === 'viewed_profile') {
      return (
        <span key={action} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
          👀 Opened Profile
        </span>
      );
    }
    if (action === 'downloaded_vcard') {
      return (
        <span key={action} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          📥 Saved Contact .vcf
        </span>
      );
    }
    if (action === 'exchanged_contact') {
      return (
        <span key={action} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
          🤝 Exchanged Info
        </span>
      );
    }
    if (action.startsWith('clicked_')) {
      const target = action.replace('clicked_', '');
      return (
        <span key={action} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
          🔗 Clicked {target.charAt(0).toUpperCase() + target.slice(1)}
        </span>
      );
    }
    if (action === 'shared_profile') {
      return (
        <span key={action} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
          📤 Shared Card
        </span>
      );
    }
    return (
      <span key={action} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral-800 text-neutral-300">
        {action}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-950">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  QR Scan Analytics & Insights
                </h2>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Detailed telemetry and engagement metrics for {userName || 'your QR card'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {scans.length > 0 && (
              <button
                id="analytics-export-csv-btn"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold transition-colors"
                title="Export scan logs as CSV file"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}

            <button
              id="analytics-modal-close-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Time Range Filter Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-950/70 p-2 rounded-2xl border border-neutral-800">
            <div className="flex items-center gap-1 text-xs font-medium text-neutral-400 px-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Timeframe:</span>
            </div>
            <div className="flex items-center gap-1">
              {(['all', '24h', '7d', '30d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRange(r)}
                  className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all ${
                    filterRange === r
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  {r === 'all' ? 'All Time' : r === '24h' ? 'Last 24h' : r === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Core KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Total Scans */}
            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/90 relative overflow-hidden">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
                <span>Total Scans</span>
                <Activity className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {totalScans}
                </span>
                <span className="text-[11px] text-neutral-400">
                  {mobileCount > 0 ? `${Math.round((mobileCount / (totalScans || 1)) * 100)}% mobile` : ''}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-indigo-300 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Active attendee scans</span>
              </div>
            </div>

            {/* 2. vCard Saves & Exchanges */}
            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/90 relative overflow-hidden">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
                <span>Contacts Saved</span>
                <UserCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                  {vcardDownloads + exchangedContacts}
                </span>
                <span className="text-[11px] text-neutral-400 font-medium">
                  {conversionRate}% rate
                </span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-300">
                {vcardDownloads} .vcf saves • {exchangedContacts} cards
              </div>
            </div>

            {/* 3. Link Clicks */}
            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/90 relative overflow-hidden">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
                <span>Touchpoint Clicks</span>
                <ExternalLink className="w-4 h-4 text-purple-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-purple-300">
                  {linkClicks}
                </span>
                <span className="text-[11px] text-neutral-400 font-medium">
                  portfolio & links
                </span>
              </div>
              <div className="mt-2 text-[11px] text-purple-300">
                LinkedIn, GitHub, Resume
              </div>
            </div>

            {/* 4. Top Device Platform */}
            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/90 relative overflow-hidden">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
                <span>Top Platform</span>
                <Smartphone className="w-4 h-4 text-sky-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-extrabold text-white truncate">
                  {topOs}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-sky-300 truncate">
                {mobileCount} phones • {desktopCount} PCs • {tabletCount} tabs
              </div>
            </div>
          </div>

          {/* Deep Insight Breakdowns (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Device & Operating System Breakdown */}
            <div className="p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                Device & OS Distribution
              </h3>

              {totalScans === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  No scan device data available yet for this timeframe
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(osCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([os, count]) => {
                      const pct = Math.round((count / totalScans) * 100);
                      return (
                        <div key={os} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-neutral-200">{os}</span>
                            <span className="text-neutral-400">{count} scans ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Scanner Browser & In-App Scanner Apps */}
            <div className="p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                Browser & Scanner Apps
              </h3>

              {totalScans === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  No browser data logged yet
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(browserCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([browser, count]) => {
                      const pct = Math.round((count / totalScans) * 100);
                      return (
                        <div key={browser} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-neutral-200 truncate">{browser}</span>
                            <span className="text-neutral-400 shrink-0">{count} scans ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Daily Timeline Activity */}
          {Object.keys(dailyDistribution).length > 0 && (
            <div className="p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Scan Activity Timeline
                </h3>
                <span className="text-[11px] text-neutral-400">Daily scan distribution</span>
              </div>

              <div className="flex items-end gap-2 pt-4 pb-2 overflow-x-auto min-h-[120px]">
                {Object.entries(dailyDistribution).map(([day, count]) => {
                  const maxCount = Math.max(...Object.values(dailyDistribution), 1);
                  const heightPercent = Math.max(Math.round((count / maxCount) * 100), 12);

                  return (
                    <div key={day} className="flex-1 min-w-[50px] flex flex-col items-center gap-1.5 group">
                      <span className="text-[10px] font-bold text-indigo-300 opacity-80 group-hover:opacity-100">
                        {count}
                      </span>
                      <div className="w-full max-w-[36px] bg-neutral-800 rounded-xl overflow-hidden h-20 flex items-end">
                        <div
                          className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-xl transition-all duration-500 group-hover:brightness-110"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-neutral-400 truncate max-w-[50px]">
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed Chronological Scans Stream */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Recent Scan Logs ({filteredScans.length})
                </h3>
                <p className="text-xs text-neutral-400">
                  Individual telemetry logs captured for each attendee scan
                </p>
              </div>

              {/* Action Filter & Search Bar */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search OS, browser, city..."
                    className="pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-52"
                  />
                </div>

                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="all">All Actions</option>
                  <option value="vcard">Saved .vcf</option>
                  <option value="exchange">Exchanged Info</option>
                  <option value="links">Clicked Links</option>
                </select>
              </div>
            </div>

            {/* Scan Logs List */}
            {filteredScans.length === 0 ? (
              <div className="py-12 px-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 text-center">
                <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 flex items-center justify-center text-neutral-400 mx-auto mb-3">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-white">No scans match your criteria</h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
                  When attendees scan your QR code at meetups or conferences, their device telemetry and interactions will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="p-4 rounded-2xl bg-neutral-950/80 hover:bg-neutral-950 border border-neutral-800/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-neutral-800/90 border border-neutral-700/80 flex items-center justify-center shrink-0 mt-0.5">
                        {getDeviceIcon(scan.deviceType)}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {scan.os}
                          </span>
                          <span className="text-xs text-neutral-400 font-medium">
                            • {scan.browser}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                            {scan.deviceType.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            {formatTimeAgo(scan.scannedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-neutral-400" />
                            {scan.timezone} ({scan.language})
                          </span>
                          {scan.screenResolution && scan.screenResolution !== 'Unknown' && (
                            <span>{scan.screenResolution}</span>
                          )}
                        </div>

                        {/* Actions Tags */}
                        {scan.actionsTaken && scan.actionsTaken.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {scan.actionsTaken.map((act) => getActionBadge(act))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Scan Timestamp & Delete Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {new Date(scan.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {onDeleteScan && (
                        <button
                          onClick={() => onDeleteScan(scan.id)}
                          className="opacity-60 hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-colors"
                          title="Delete scan entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Anonymous privacy-preserving event analytics</span>
          </div>

          <div className="flex items-center gap-2">
            {scans.length > 0 && onClearAllScans && (
              <>
                {confirmClear ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-400">Clear all records?</span>
                    <button
                      onClick={() => {
                        onClearAllScans();
                        setConfirmClear(false);
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
                    >
                      Yes, Clear
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="px-2.5 py-1 bg-neutral-800 text-neutral-300 rounded-lg text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="px-3 py-1 text-xs text-neutral-400 hover:text-rose-400 transition-colors font-medium"
                  >
                    Clear History
                  </button>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

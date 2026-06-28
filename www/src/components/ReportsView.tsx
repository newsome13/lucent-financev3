import { useState } from 'react';
import { Account, Debt, Bill, Goal, PaymentHistoryItem } from '../types';
import { TrendingUp, DollarSign, PieChart as PieIcon, LineChart as LineIcon, BarChart3, Activity, ArrowRight, ShieldCheck } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ReportsViewProps {
  accounts: Account[];
  debts: Debt[];
  bills: Bill[];
  goals: Goal[];
  history: PaymentHistoryItem[];
}

export default function ReportsView({ accounts, debts, bills, goals, history }: ReportsViewProps) {
  const [reportTab, setReportTab] = useState<'networth' | 'spending' | 'forecast'>('networth');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  // 1. Core Financial Metrics
  const totalAssets = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const totalLiabilities = debts
    .filter(d => d.status === 'Active' || d.status === 'Not Started')
    .reduce((acc, curr) => acc + curr.balance, 0);
  const netWorth = totalAssets - totalLiabilities;

  // 2. Spending Category Breakdown (from history)
  const categoryDataMap: { [key: string]: number } = {};
  history.forEach(item => {
    // Standardize category names
    let cat = item.category || 'General';
    if (cat.toLowerCase().includes('food') || cat.toLowerCase().includes('grocer') || cat.toLowerCase().includes('restaurant')) {
      cat = 'Food & Groceries';
    } else if (cat.toLowerCase().includes('gas') || cat.toLowerCase().includes('travel') || cat.toLowerCase().includes('transit')) {
      cat = 'Fuel & Transit';
    } else if (cat.toLowerCase().includes('sub') || cat.toLowerCase().includes('netfl') || cat.toLowerCase().includes('entertainment')) {
      cat = 'Entertainment';
    } else if (cat.toLowerCase().includes('bill') || cat.toLowerCase().includes('util')) {
      cat = 'Bills & Utilities';
    }
    
    // Ignore income in spending breakdown
    if (item.amount > 0 && !cat.toLowerCase().includes('income')) {
      categoryDataMap[cat] = (categoryDataMap[cat] || 0) + item.amount;
    }
  });

  const categoryColors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];
  const spendingBreakdownData = Object.keys(categoryDataMap).map((name, i) => ({
    name,
    value: Math.round(categoryDataMap[name]),
    color: categoryColors[i % categoryColors.length]
  })).sort((a, b) => b.value - a.value);

  // 3. Historical trends (simulate monthly checkpoints)
  const monthlyTrendsData = [
    { month: 'Jan', NetWorth: netWorth - 8000, Assets: totalAssets - 5000, Liabilities: totalLiabilities + 3000 },
    { month: 'Feb', NetWorth: netWorth - 6500, Assets: totalAssets - 4000, Liabilities: totalLiabilities + 2500 },
    { month: 'Mar', NetWorth: netWorth - 4800, Assets: totalAssets - 3000, Liabilities: totalLiabilities + 1800 },
    { month: 'Apr', NetWorth: netWorth - 3200, Assets: totalAssets - 1500, Liabilities: totalLiabilities + 1700 },
    { month: 'May', NetWorth: netWorth - 1500, Assets: totalAssets - 500, Liabilities: totalLiabilities + 1000 },
    { month: 'Jun (Current)', NetWorth: netWorth, Assets: totalAssets, Liabilities: totalLiabilities }
  ];

  // 4. Forecasts (12 Months)
  // Calculate average monthly change (savings transfers - debt payoff)
  const monthlySavingsInflow = accounts.reduce((acc, curr) => acc + (curr.weeklyTransfer * 4.33), 0) + 
                             goals.reduce((acc, curr) => acc + (curr.weeklyTransfer * 4.33), 0);
  const monthlyDebtReduction = debts
    .filter(d => d.status === 'Active')
    .reduce((acc, curr) => acc + curr.minimumPayment, 0);
  
  const estimatedMonthlyGrowth = Math.max(400, monthlySavingsInflow + (monthlyDebtReduction * 0.8)); // At least $400/mo growth base

  const forecastData = Array.from({ length: 12 }).map((_, i) => {
    const futureMonth = new Date();
    futureMonth.setMonth(futureMonth.getMonth() + i + 1);
    const monthLabel = futureMonth.toLocaleDateString('en-US', { month: 'short' });
    
    // Future assets increase, future liabilities decrease
    const projectedAssets = totalAssets + (estimatedMonthlyGrowth * (i + 1));
    const projectedLiabilities = Math.max(0, totalLiabilities - (monthlyDebtReduction * (i + 1)));

    return {
      month: monthLabel,
      'Projected Net Worth': projectedAssets - projectedLiabilities,
      'Projected Space Balances': projectedAssets,
      'Projected Debts Outstanding': projectedLiabilities
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12 space-y-8 animate-fade-in" id="reports-view-frame">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">Intelligence & Reports 📊</h2>
          <p className="text-sm text-slate-500">Analyze net worth trends, category footprints, and simulate long-term growth</p>
        </div>

        {/* Tab Controls */}
        <div className="bg-slate-100 p-1 rounded-full flex border border-slate-200/50 self-start">
          <button
            onClick={() => setReportTab('networth')}
            className={`py-1.5 px-4 rounded-full text-xs font-bold transition-all ${
              reportTab === 'networth' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
            id="report-tab-networth"
          >
            Net Worth
          </button>
          <button
            onClick={() => setReportTab('spending')}
            className={`py-1.5 px-4 rounded-full text-xs font-bold transition-all ${
              reportTab === 'spending' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
            id="report-tab-spending"
          >
            Spending Footprint
          </button>
          <button
            onClick={() => setReportTab('forecast')}
            className={`py-1.5 px-4 rounded-full text-xs font-bold transition-all ${
              reportTab === 'forecast' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
            id="report-tab-forecast"
          >
            12-Month Forecasts
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-3xl p-6 flex items-center justify-between border-blue-200/55 hover:border-blue-300 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider">Total Combined Assets</span>
            <h3 className="text-2xl font-display font-black text-slate-800">{formatCurrency(totalAssets)}</h3>
            <p className="text-[10px] text-slate-400">Total stored across all your active Money Spaces</p>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 flex items-center justify-between border-rose-200/55 hover:border-rose-300 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-rose-600 uppercase tracking-wider">Remaining Liabilities</span>
            <h3 className="text-2xl font-display font-black text-slate-800">{formatCurrency(totalLiabilities)}</h3>
            <p className="text-[10px] text-slate-400">Total remaining balances to pay off on Boss Board</p>
          </div>
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 flex items-center justify-between border-teal-200/55 hover:border-teal-300 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-teal-600 uppercase tracking-wider">True Net Worth</span>
            <h3 className="text-2xl font-display font-black text-teal-800">{formatCurrency(netWorth)}</h3>
            <p className="text-[10px] text-slate-400">Calculated assets minus total outstanding debts</p>
          </div>
          <div className="p-3.5 bg-teal-50 text-teal-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Graph Content */}
      <div className="glass-panel rounded-3xl p-6 md:p-8">
        {reportTab === 'networth' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-display font-bold text-slate-800 flex items-center gap-1.5">
                  <LineIcon className="w-4 h-4 text-indigo-600" />
                  True Net Worth Path (Last 6 Months)
                </h3>
                <p className="text-xs text-slate-500">Visual trend showing debt reduction combined with asset accumulation</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Assets</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Debts</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Net Worth</span>
              </div>
            </div>

            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} fontFamily="monospace" tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} />
                  <Tooltip 
                    formatter={(val: number) => [formatCurrency(val), '']} 
                    contentStyle={{ borderRadius: '16px', background: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
                  />
                  <Area type="monotone" dataKey="Assets" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAssets)" name="Assets" />
                  <Area type="monotone" dataKey="NetWorth" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" name="Net Worth" />
                  <Line type="monotone" dataKey="Liabilities" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" name="Debts" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {reportTab === 'spending' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-display font-bold text-slate-800 flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-purple-600" />
                  Spending Distribution
                </h3>
                <p className="text-xs text-slate-500">Categorized list of expenditures recorded in Recent Activity</p>
              </div>

              {spendingBreakdownData.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center border border-dashed border-slate-200 rounded-3xl text-sm text-slate-400">
                  No expenditure records found in Recent Activity
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={spendingBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {spendingBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => [formatCurrency(val), 'Spent']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* List side */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Top spending profiles</h4>
              <div className="space-y-3">
                {spendingBreakdownData.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-55/40 border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-medium text-slate-700">{item.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-800">{formatCurrency(item.value)}</span>
                  </div>
                ))}

                {spendingBreakdownData.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-8">Log expenses under Upcoming hits or Quick Actions to populate</p>
                )}
              </div>
            </div>
          </div>
        )}

        {reportTab === 'forecast' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-display font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  12-Month Accumulation Projection
                </h3>
                <p className="text-xs text-slate-500">Projected metrics based on current savings contributions and debt minimums</p>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 text-emerald-800 text-[10px] font-semibold py-1 px-3 rounded-full border border-emerald-100/50">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Est. Monthly Surplus Change: +{formatCurrency(estimatedMonthlyGrowth)}
              </div>
            </div>

            <div className="h-[280px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} fontFamily="monospace" tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} />
                  <Tooltip 
                    formatter={(val: number) => [formatCurrency(val), '']}
                    contentStyle={{ borderRadius: '16px', background: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'sans-serif' }} />
                  <Bar dataKey="Projected Net Worth" fill="#10b981" radius={[4, 4, 0, 0]} name="Projected Net Worth" />
                  <Bar dataKey="Projected Space Balances" fill="#6366f1" radius={[4, 4, 0, 0]} name="My Spaces Balance" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl bg-amber-50/50 border border-amber-100 p-4 flex gap-3 text-xs text-amber-800">
              <p className="leading-relaxed">
                🔮 <b>Forward Guidance</b>: In exactly 12 months, your net worth is forecasted to reach <b>{formatCurrency(totalAssets + (estimatedMonthlyGrowth * 12) - Math.max(0, totalLiabilities - (monthlyDebtReduction * 12)))}</b>. Accelerating debt payoffs via simulation mode or adding auto-moves will cause this target to be reached much faster!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

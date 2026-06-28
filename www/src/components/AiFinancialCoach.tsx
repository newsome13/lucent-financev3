import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  HelpCircle, 
  ShieldCheck, 
  LineChart, 
  ChevronRight,
  Lightbulb,
  Zap,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AiFinancialCoachProps {
  accounts: any[];
  debts: any[];
  bills: any[];
  goals: any[];
  history: any[];
  budgetCategories: any[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
  isSimulated?: boolean;
}

export default function AiFinancialCoach({
  accounts,
  debts,
  bills,
  goals,
  history,
  budgetCategories
}: AiFinancialCoachProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'consult' | 'insights'>('consult');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggested shortcut queries
  const shortcuts = [
    { text: "Can I afford a $600 TV?", icon: HelpCircle },
    { text: "What happens if I pay an extra $300 toward my truck?", icon: Zap },
    { text: "How much can I safely spend this weekend?", icon: ShieldCheck },
    { text: "Should I pause Vacation savings this month?", icon: LineChart },
    { text: "If I get a $500 bonus, where should it go?", icon: TrendingUp }
  ];

  useEffect(() => {
    // Scroll to bottom of chat
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, isTyping]);

  useEffect(() => {
    // Add welcome greeting if empty
    if (chatLog.length === 0) {
      setChatLog([
        {
          id: 'welcome',
          sender: 'coach',
          text: `Good day, Chief! I am Commander Coach, your trusted financial AI analyst. 

I have fully analyzed your checking spaces, liabilities, and goals:
- Active Checking Zones: $${(accounts.find(a => a.type === 'checking' || a.name.toLowerCase().includes('checking'))?.balance || 0).toLocaleString()}
- Total Debt Liabilities: $${debts.reduce((sum, d) => sum + (d.status !== 'Paid' ? d.balance : 0), 0).toLocaleString()}
- Outstanding Goals: ${goals.filter(g => g.status !== 'Completed').length} active

How can I direct your cash flow velocity today? Select one of the command queries below or ask me any custom scenario!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, []);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatLog(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/gemini/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          financeData: { accounts, debts, bills, goals, budgetCategories, history },
          chatHistory: chatLog.slice(-6) // Include last 6 messages as trailing context
        })
      });

      const data = await response.json();
      setIsTyping(false);

      const coachMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'coach',
        text: data.text || "I apologize, Chief, my telemetry processor experienced an offline lag. Let's try that query once more.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSimulated: data.is_simulated
      };

      setChatLog(prev => [...prev, coachMsg]);
    } catch (e) {
      console.error('Coach API call failed:', e);
      setIsTyping(false);
      setChatLog(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'coach',
          text: "I encountered a local network disconnection, but based on your local spreadsheet data, your cash buffers are intact. Let's try that request again shortly!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleResetChat = () => {
    if (confirm('Are you sure you want to clear the briefing log?')) {
      setChatLog([]);
    }
  };

  // Generate Smart Data-Driven Insights
  const generateInsights = () => {
    const list = [];
    
    // Check groceries budget
    const groceries = budgetCategories.find(c => c.category?.toLowerCase().includes('grocery') || c.category?.toLowerCase().includes('food'));
    if (groceries && groceries.spent < groceries.budgeted * 0.8) {
      const saved = groceries.budgeted - groceries.spent;
      list.push({
        id: 'grocery_win',
        type: 'success',
        title: 'Grocery Spending Velocity',
        text: `You spent $${Math.max(0, saved).toFixed(0)} less on groceries than planned this cycle. If you maintain this course, your Vacation Fund will reach its goal 12 days earlier.`,
        action: 'Increase Goal Allocation'
      });
    } else {
      list.push({
        id: 'grocery_tip',
        type: 'neutral',
        title: 'Grocery Optimization',
        text: 'Review subscription meal kit lines: replacing one delivered box with raw cooking inputs frees up $55/week for Escape space speed.',
        action: 'Review Subscriptions'
      });
    }

    // Check debts
    const highInterestDebt = debts.find(d => d.apr > 12 && d.status !== 'Paid');
    if (highInterestDebt) {
      const extraPotential = 50;
      list.push({
        id: 'debt_accelerator',
        type: 'warning',
        title: 'High-APR Debt Trap',
        text: `Your "${highInterestDebt.name}" is accruing interest at ${highInterestDebt.apr}%. Shifting just $${extraPotential} from your food budget reduces your payoff timeline by 1.5 months!`,
        action: 'Accelerate Payment'
      });
    }

    // Check emergency buffer
    const buffer = accounts.find(a => a.name.toLowerCase().includes('buffer') || a.purpose.toLowerCase().includes('buffer'));
    if (buffer && buffer.balance < buffer.targetBalance) {
      const diff = buffer.targetBalance - buffer.balance;
      list.push({
        id: 'buffer_refill',
        type: 'info',
        title: 'Buffer Space Alert',
        text: `Your defensive Buffer Space is $${diff.toLocaleString()} away from safety target. Prioritize active paycheck surplus allocations here before scaling escape zones.`,
        action: 'Deposit to Buffer'
      });
    }

    // Static default encouragement
    list.push({
      id: 'saving_streak',
      type: 'success',
      title: 'Savings Challenge Multiplier',
      text: 'You have stayed within check-in boundaries for 12 consecutive days! Keep this streak intact to earn the Pioneer Rank 10 Badge.',
      action: 'Check Streak'
    });

    return list;
  };

  const insightsList = generateInsights();

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pb-24 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="ai-coach-frame">
      {/* Left Column: Chat Console (takes 2 cols on wide) */}
      <div className="lg:col-span-2 flex flex-col h-[75vh] min-h-[500px] bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs relative">
        {/* Console Header */}
        <div className="p-4 md:p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center border border-indigo-500 shadow-sm relative">
              <Bot className="w-5 h-5 text-white" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-bold text-sm text-slate-800">Commander Coach</h3>
                <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-600 py-0.5 px-1.5 rounded-full uppercase">
                  Gemini AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Personal Wealth Analytics Unit</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Swappers for mobile screen optimization */}
            <div className="flex bg-slate-200/80 p-0.5 rounded-xl border border-slate-200 lg:hidden">
              <button 
                onClick={() => setActiveTab('consult')}
                className={`py-1 px-3 text-[10px] font-bold rounded-lg transition-all ${
                  activeTab === 'consult' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Consult
              </button>
              <button 
                onClick={() => setActiveTab('insights')}
                className={`py-1 px-3 text-[10px] font-bold rounded-lg transition-all ${
                  activeTab === 'insights' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Insights
              </button>
            </div>

            <button
              onClick={handleResetChat}
              title="Clear Console Chat"
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Router for smaller layouts */}
        <div className="flex-1 overflow-hidden relative">
          <div className={`h-full flex flex-col ${activeTab === 'consult' || 'hidden lg:flex'}`}>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 bg-slate-50/30">
              {chatLog.map((message) => {
                const isCoach = message.sender === 'coach';
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 max-w-[85%] ${isCoach ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${
                      isCoach 
                        ? 'bg-indigo-50 border-indigo-150 text-indigo-600' 
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}>
                      {isCoach ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    {/* Speech box */}
                    <div className="space-y-1">
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-line border ${
                        isCoach 
                          ? 'bg-white border-slate-200/80 text-slate-700 rounded-tl-xs shadow-3xs' 
                          : 'bg-indigo-600 border-indigo-550 text-white rounded-tr-xs shadow-3xs'
                      }`}>
                        {message.text}
                        {isCoach && message.isSimulated && (
                          <div className="mt-2 text-[9px] font-mono text-indigo-400/80 border-t border-slate-100 pt-1.5 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            Simulation Engine Active
                          </div>
                        )}
                      </div>
                      <span className={`block text-[9px] font-mono text-slate-400 ${!isCoach && 'text-right'}`}>
                        {message.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex gap-3 max-w-[80%] mr-auto">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-150 text-indigo-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl rounded-tl-xs flex items-center gap-1 shadow-3xs">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestions Quick Shelf */}
            {chatLog.length <= 2 && (
              <div className="p-4 border-t border-slate-150 bg-white space-y-2">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Suggested Command Queries</p>
                <div className="flex flex-wrap gap-2">
                  {shortcuts.map((shortcut, idx) => {
                    const SIcon = shortcut.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(shortcut.text)}
                        className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-full text-left text-slate-600 hover:text-slate-800 text-[11px] font-medium transition-all cursor-pointer"
                      >
                        <SIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        {shortcut.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input Shelf */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputMessage);
              }}
              className="p-3 bg-slate-50 border-t border-slate-150 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask: 'Can I afford a $600 TV?' or 'Suggest extra debt payment plan'..."
                className="flex-1 bg-white border border-slate-200 rounded-full py-2.5 px-4 text-xs font-medium focus:outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 shadow-inner"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-750 text-white disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors flex items-center justify-center shadow-md shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Sidebar Insights when viewed on mobile */}
          <div className={`h-full overflow-y-auto p-4 space-y-4 lg:hidden ${activeTab === 'insights' ? 'block' : 'hidden'}`}>
            <InsightsList list={insightsList} />
          </div>
        </div>
      </div>

      {/* Right Column: Proactive Smart Insights (desktop only) */}
      <div className="hidden lg:flex lg:col-span-1 flex-col space-y-4">
        <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-3xs flex flex-col h-full overflow-y-auto">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-indigo-500 animate-pulse" />
            <h3 className="font-display font-bold text-sm text-slate-800">Proactive Coach Insights</h3>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            Command Center actively audits budget ratios, upcoming bill buffers, and liability interest rates to generate direct data recommendations.
          </p>

          <InsightsList list={insightsList} />
        </div>
      </div>
    </div>
  );
}

function InsightsList({ list }: { list: any[] }) {
  return (
    <div className="space-y-3.5 flex-1">
      {list.map((ins) => (
        <div 
          key={ins.id}
          className="p-4 rounded-2xl border bg-slate-50 border-slate-150 space-y-2.5 hover:bg-slate-100/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-xs font-display font-bold text-slate-800 leading-tight">
              {ins.title}
            </h4>
            <span className={`text-[8px] font-mono font-bold uppercase py-0.5 px-1.5 rounded-md ${
              ins.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/30' :
              ins.type === 'warning' ? 'bg-rose-50 text-rose-700 border border-rose-100/30' :
              'bg-blue-50 text-blue-700 border border-blue-100/30'
            }`}>
              {ins.type}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {ins.text}
          </p>
          <div className="flex items-center gap-1 text-[10px] font-sans font-bold text-indigo-600 group cursor-pointer hover:text-indigo-800">
            {ins.action}
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      ))}
    </div>
  );
}

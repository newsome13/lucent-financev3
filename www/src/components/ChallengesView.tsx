import { useState, FormEvent } from 'react';
import { SavingsChallenge } from '../types';
import { Plus, Trash, Trophy, CheckSquare, Square, Calendar, Flame, Target } from 'lucide-react';

interface ChallengesViewProps {
  challenges: SavingsChallenge[];
  onUpdateChallenges: (updated: SavingsChallenge[]) => void;
  goalsList: string[];
}

export default function ChallengesView({ challenges, onUpdateChallenges, goalsList }: ChallengesViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [estSavings, setEstSavings] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [goal, setGoal] = useState(goalsList[0] || 'Safety Net 🛟');
  const [startDate, setStartDate] = useState('');

  // Toggle Complete
  const toggleComplete = (challengeName: string) => {
    const updated = challenges.map(c => {
      if (c.challenge === challengeName) {
        const nextCompleted = !c.completed;
        const actualSaved = nextCompleted ? c.estimatedSavings : 0;
        return {
          ...c,
          completed: nextCompleted,
          amountSaved: actualSaved
        };
      }
      return c;
    });
    onUpdateChallenges(updated);
  };

  // Add Challenge
  const handleAddChallenge = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !estSavings) return;

    const newChallenge: SavingsChallenge = {
      challenge: name,
      estimatedSavings: parseFloat(estSavings) || 0,
      difficulty,
      goalSupported: goal,
      startDate: startDate || new Date().toISOString().split('T')[0],
      completed: false,
      amountSaved: 0
    };

    onUpdateChallenges([...challenges, newChallenge]);
    setIsAdding(false);

    // Clear
    setName('');
    setEstSavings('');
    setStartDate('');
  };

  // Delete Challenge
  const handleDeleteChallenge = (challengeName: string) => {
    const confirmed = window.confirm(`Permanently remove savings challenge "${challengeName}"?`);
    if (!confirmed) return;
    const updated = challenges.filter(c => c.challenge !== challengeName);
    onUpdateChallenges(updated);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12 space-y-6 animate-fade-in" id="challenges-tab-content">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">Active Savings Challenges</h2>
          <p className="text-sm text-slate-500">Form powerful cash habits, skip takeouts, and channel saved cash to target goals</p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-semibold shadow-md transition-all duration-200 self-start"
          id="add-challenge-toggle-btn"
        >
          <Plus className="w-4 h-4" />
          Create Challenge
        </button>
      </div>

      {/* Form Card */}
      {isAdding && (
        <div className="glass-panel rounded-3xl p-6 border-purple-200 bg-purple-50/10 animate-slide-up">
          <h3 className="font-display font-bold text-base text-slate-800 mb-4">Register New Savings Challenge</h3>
          <form onSubmit={handleAddChallenge} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Challenge Title</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. No Takeout Week"
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-purple-500"
                id="challenge-form-name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Estimated Savings ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={estSavings}
                onChange={e => setEstSavings(e.target.value)}
                placeholder="100.00"
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-purple-500"
                id="challenge-form-savings"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Difficulty</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-purple-500"
                id="challenge-form-diff"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Goal Supported</label>
              <select
                value={goal}
                onChange={e => setGoal(e.target.value)}
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-purple-500"
                id="challenge-form-goal"
              >
                {goalsList.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Launch Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-purple-500"
                id="challenge-form-date"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="py-2 px-4 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100"
                id="challenge-form-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-semibold shadow-md"
                id="challenge-form-submit"
              >
                Launch Challenge
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid Layout of Challenge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {challenges.map(c => {
          const diffColor = c.difficulty === 'Easy' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/40' 
            : c.difficulty === 'Medium' 
              ? 'bg-purple-50 text-purple-700 border-purple-200/40' 
              : 'bg-rose-50 text-rose-700 border-rose-200/40';

          return (
            <div
              key={c.challenge}
              className={`glass-panel rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all duration-200 ${
                c.completed ? 'bg-emerald-50/10 border-emerald-200/40 opacity-75' : ''
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-purple-500/15 text-purple-800 rounded-xl">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-mono font-bold py-0.5 px-2 rounded-full border ${diffColor}`}>
                    {c.difficulty}
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-extrabold text-slate-800 text-sm leading-snug">{c.challenge}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Launched {c.startDate}
                  </div>
                </div>

                <div className="pt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Est. Reward:</span>
                    <span className="font-mono font-bold text-slate-700">{formatCurrency(c.estimatedSavings)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Amount Saved:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {c.completed ? formatCurrency(c.amountSaved || c.estimatedSavings) : '$0.00'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 py-1 px-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500">
                    <Target className="w-3.5 h-3.5 text-purple-600" />
                    Supports: {c.goalSupported}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => toggleComplete(c.challenge)}
                  className={`flex items-center gap-1 text-xs py-1.5 px-3 rounded-full font-bold transition-all ${
                    c.completed 
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                  id={`challenge-complete-btn-${c.challenge.replace(/\s+/g, '-')}`}
                >
                  {c.completed ? 'Finished!' : 'Mark Completed'}
                </button>
                <button
                  onClick={() => handleDeleteChallenge(c.challenge)}
                  className="p-1.5 rounded-full text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  id={`challenge-delete-btn-${c.challenge.replace(/\s+/g, '-')}`}
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

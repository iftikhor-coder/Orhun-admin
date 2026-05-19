import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, AlertTriangle, MessageCircle, Send } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { OverviewCharts } from '@/components/analytics/overview-charts';
import { MultiAccountTab } from '@/components/analytics/multi-account-tab';
import { FeedbackTab } from '@/components/analytics/feedback-tab';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

type Tab = 'overview' | 'multi_account' | 'feedback';

const TABS: {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'overview',      label: 'Umumiy',        icon: BarChart3 },
  { id: 'multi_account', label: 'Multi-account',  icon: AlertTriangle },
  { id: 'feedback',      label: 'Feedback',       icon: MessageCircle },
];

export function AnalyticsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        icon={Activity}
        title="Analitika va xavfsizlik"
        subtitle="Grafiklar, davlatlar, multi-account aniqlash, feedback"
        action={
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="flex items-center gap-2 rounded-lg bg-gradient-admin px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02]"
          >
            <Send className="h-3.5 w-3.5" />
            Mass message
          </button>
        }
      />

      {/* Tab navigation */}
      <div className="mb-6 flex gap-1 border-b border-gold-900/30">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t.id
                ? 'border-b-2 border-admin-500 text-admin-300'
                : 'text-gold-300/70 hover:text-gold-100',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview'      && <OverviewCharts />}
      {tab === 'multi_account' && <MultiAccountTab />}
      {tab === 'feedback'      && <FeedbackTab />}
    </div>
  );
}

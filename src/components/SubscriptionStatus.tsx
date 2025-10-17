import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { subscriptionService } from '../lib/subscription';
import type { UsageSummary } from '../lib/subscription';
import { Crown, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { SkeletonLoader } from './ui';

interface SubscriptionStatusProps {
  userId: number;
  isDarkMode: boolean;
}

export default function SubscriptionStatus({ userId, isDarkMode }: SubscriptionStatusProps) {
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsageSummary();
  }, [userId]);

  const loadUsageSummary = async () => {
    try {
      setLoading(true);
      const summary = await subscriptionService.getUsageSummary(userId);
      setUsageSummary(summary);
      setError(null);
    } catch (err) {
      setError('Failed to load usage information');
      console.error('Error loading usage summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFeatureStatus = (feature: keyof UsageSummary['usage']) => {
    if (!usageSummary) return { hasAccess: false, remaining: 0 };
    
    const featureData = usageSummary.usage[feature];
    const hasAccess = featureData.limit > featureData.used || featureData.limit === -1;
    const remaining = featureData.limit === -1 ? -1 : featureData.limit - featureData.used;
    
    return { hasAccess, remaining };
  };

  const getFeatureIcon = (feature: keyof UsageSummary['usage']) => {
    const { hasAccess, remaining } = getFeatureStatus(feature);
    
    if (remaining === -1) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (hasAccess) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <Lock className="w-4 h-4 text-red-500" />;
  };

  if (loading) {
    return (
      <div className={cn(
        "p-4 rounded-lg border",
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      )}>
        <SkeletonLoader variant="card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "p-4 rounded-lg border",
        isDarkMode ? "bg-red-900/20 border-red-700" : "bg-red-50 border-red-200"
      )}>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className={cn(
            "text-sm",
            isDarkMode ? "text-red-300" : "text-red-700"
          )}>
            {error}
          </span>
        </div>
      </div>
    );
  }

  if (!usageSummary) {
    return null;
  }

  return (
    <div className={cn(
      "p-4 rounded-lg border",
      isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {usageSummary.subscription_tier === 'pro' ? (
            <Crown className="w-5 h-5 text-yellow-500" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-300"></div>
          )}
          <h3 className={cn(
            "font-semibold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            {usageSummary.subscription_tier === 'pro' ? 'Pro Plan' : 'Free Plan'}
          </h3>
        </div>
        <span className={cn(
          "text-xs px-2 py-1 rounded-full",
          usageSummary.subscription_tier === 'pro'
            ? "bg-yellow-100 text-yellow-800"
            : "bg-gray-100 text-gray-600"
        )}>
          {usageSummary.subscription_tier.toUpperCase()}
        </span>
      </div>

      {/* Usage Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Text Chat */}
        <div className={cn(
          "p-3 rounded-lg border",
          isDarkMode ? "border-gray-600" : "border-gray-200"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className={cn(
              "text-sm font-medium",
              isDarkMode ? "text-gray-300" : "text-gray-600"
            )}>
              Text Chat
            </span>
            {getFeatureIcon('text_chat')}
          </div>
          <div className={cn(
            "text-xs",
            isDarkMode ? "text-gray-400" : "text-gray-500"
          )}>
            {usageSummary.usage.text_chat.used}/{usageSummary.usage.text_chat.limit}
          </div>
        </div>

        {/* Voice Input */}
        <div className={cn(
          "p-3 rounded-lg border",
          isDarkMode ? "border-gray-600" : "border-gray-200"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className={cn(
              "text-sm font-medium",
              isDarkMode ? "text-gray-300" : "text-gray-600"
            )}>
              Voice Input
            </span>
            {getFeatureIcon('voice_input')}
          </div>
          <div className={cn(
            "text-xs",
            isDarkMode ? "text-gray-400" : "text-gray-500"
          )}>
            {usageSummary.usage.voice_input.used}/{usageSummary.usage.voice_input.limit}
          </div>
        </div>

        {/* Quiz Access */}
        <div className={cn(
          "p-3 rounded-lg border",
          isDarkMode ? "border-gray-600" : "border-gray-200"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className={cn(
              "text-sm font-medium",
              isDarkMode ? "text-gray-300" : "text-gray-600"
            )}>
              Quiz Access
            </span>
            {getFeatureIcon('quiz_access')}
          </div>
          <div className={cn(
            "text-xs",
            isDarkMode ? "text-gray-400" : "text-gray-500"
          )}>
            {usageSummary.usage.quiz_access.used}/{usageSummary.usage.quiz_access.limit}
          </div>
        </div>

        {/* Material Access */}
        <div className={cn(
          "p-3 rounded-lg border",
          isDarkMode ? "border-gray-600" : "border-gray-200"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className={cn(
              "text-sm font-medium",
              isDarkMode ? "text-gray-300" : "text-gray-600"
            )}>
              Material Access
            </span>
            {getFeatureIcon('material_access')}
          </div>
          <div className={cn(
            "text-xs",
            isDarkMode ? "text-gray-400" : "text-gray-500"
          )}>
            {usageSummary.usage.material_access.used}/{usageSummary.usage.material_access.limit}
          </div>
        </div>
      </div>

      {/* Upgrade Button for Free Users */}
      {usageSummary.subscription_tier === 'free' && (
        <button
          onClick={() => {
            // Handle upgrade logic
          }}
          className={cn(
            "w-full mt-4 py-2 px-4 rounded-lg font-medium transition-colors",
            "bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
            "hover:from-yellow-600 hover:to-orange-600"
          )}
        >
          Upgrade to Pro
        </button>
      )}

      {/* Last Reset Info */}
      <div className={cn(
        "mt-3 text-xs",
        isDarkMode ? "text-gray-500" : "text-gray-400"
      )}>
        Resets daily at {new Date(usageSummary.last_reset).toLocaleTimeString()}
      </div>
    </div>
  );
} 
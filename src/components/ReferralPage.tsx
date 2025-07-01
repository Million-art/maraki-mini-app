import { useState, useCallback } from "react";
import { Users, Share2, Copy, Gift, TrendingUp, UserPlus, CheckCircle } from "lucide-react";
import { cn } from "../lib/utils";

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  referralCode: string;
}

interface ReferralHistory {
  id: string;
  name: string;
  email: string;
  status: "completed" | "pending" | "failed";
  date: Date;
  earnings: number;
}

interface ReferralPageProps {}

const mockReferralStats: ReferralStats = {
  totalReferrals: 12,
  successfulReferrals: 8,
  pendingReferrals: 4,
  totalEarnings: 240,
  referralCode: "MINIAPP2024",
};

const mockReferralHistory: ReferralHistory[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    status: "completed",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    earnings: 30,
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    status: "pending",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    earnings: 0,
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@example.com",
    status: "completed",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    earnings: 30,
  },
  {
    id: "4",
    name: "Sarah Wilson",
    email: "sarah@example.com",
    status: "completed",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    earnings: 30,
  },
];

export default function ReferralPage({}: ReferralPageProps) {
  const [referralStats] = useState<ReferralStats>(mockReferralStats);
  const [referralHistory] = useState<ReferralHistory[]>(mockReferralHistory);
  const [copied, setCopied] = useState(false);

  const copyReferralCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralStats.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy referral code:', err);
    }
  }, [referralStats.referralCode]);

  const shareReferral = useCallback(async () => {
    const shareText = `Join me on Mini App! Use my referral code: ${referralStats.referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mini App Referral',
          text: shareText,
          url: 'https://miniapp.com',
        });
      } catch (err) {
        console.error('Failed to share:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy share text:', err);
      }
    }
  }, [referralStats.referralCode]);

  const getStatusColor = (status: ReferralHistory["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return "Today";
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Referral Program</h1>
        <p className="text-sm text-gray-600">Invite friends and earn rewards together</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-gray-500">
                Total Referrals
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {referralStats.totalReferrals}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <UserPlus className="w-6 h-6 text-green-600" />
              <span className="text-sm font-medium text-gray-500">
                Successful
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {referralStats.successfulReferrals}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
              <span className="text-sm font-medium text-gray-500">
                Pending
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {referralStats.pendingReferrals}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-6 h-6 text-purple-600" />
              <span className="text-sm font-medium text-gray-500">
                Total Earnings
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${referralStats.totalEarnings}
            </div>
          </div>
        </div>

        {/* Referral Code Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Referral Code
          </h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 p-3 rounded-lg border border-gray-300 bg-gray-50 font-mono text-lg text-gray-900">
              {referralStats.referralCode}
            </div>
            <button
              onClick={copyReferralCode}
              className={cn(
                "p-3 rounded-lg border transition-colors flex items-center gap-2",
                copied
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-300 hover:bg-gray-50 text-gray-700"
              )}
            >
              {copied ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span className="text-sm font-medium">Copy</span>
                </>
              )}
            </button>
          </div>
          <button
            onClick={shareReferral}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Share2 className="w-5 h-5" />
            Share Referral
          </button>
        </div>

        {/* Referral History */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Referral History
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {referralHistory.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No referrals yet
                </h3>
                <p className="text-sm text-gray-500">
                  Start sharing your referral code to see your history here
                </p>
              </div>
            ) : (
              referralHistory.map((referral) => (
                <div key={referral.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{referral.name}</h4>
                      <p className="text-sm text-gray-500">{referral.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        getStatusColor(referral.status)
                      )}>
                        {referral.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {formatDate(referral.date)}
                    </span>
                    <span className="font-medium text-gray-900">
                      ${referral.earnings}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
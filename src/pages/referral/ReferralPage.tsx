import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { cn } from "../../lib/utils";
import { Users, Share2, Copy, CheckCircle, Gift } from "lucide-react";
import { Skeleton } from "../../components/ui";

interface ReferralPageContext {
  isDarkMode: boolean;
}

export default function ReferralPage() {
  const { isDarkMode } = useOutletContext<ReferralPageContext>();
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading referral data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // 1 second loading simulation

    return () => clearTimeout(timer);
  }, []);

  const referralStats = {
    totalReferrals: 12,
    successfulReferrals: 8,
    pendingReferrals: 4,
    totalEarnings: 240,
    thisMonth: 60,
  };

  const referralHistory = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      status: "completed",
      date: "2024-01-15",
      earnings: 30,
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      status: "pending",
      date: "2024-01-14",
      earnings: 0,
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike@example.com",
      status: "completed",
      date: "2024-01-13",
      earnings: 30,
    },
    {
      id: 4,
      name: "Sarah Wilson",
      email: "sarah@example.com",
      status: "completed",
      date: "2024-01-12",
      earnings: 30,
    },
  ];

  const referralCode = "FRIEND2024";

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on this amazing platform!",
          text: `Use my referral code ${referralCode} to get started!`,
          url: "https://example.com/referral",
        });
      } catch (err) {
        console.error("Error sharing: ", err);
      }
    } else {
      handleCopyCode();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        {/* Header Skeleton */}
        <header className={cn(
          "flex items-center justify-between p-4 border-b",
          isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        )}>
          <Skeleton height="24px" width="150px" />
          <Skeleton height="24px" width="24px" variant="circular" />
        </header>

        {/* Content Skeleton */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-2 gap-4">
            <Skeleton height="100px" />
            <Skeleton height="100px" />
          </div>

          {/* Referral Code Section Skeleton */}
          <Skeleton height="120px" />

          {/* How It Works Skeleton */}
          <Skeleton height="150px" />

          {/* Referral History Skeleton */}
          <Skeleton height="200px" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className={cn(
        "flex items-center justify-between p-4 border-b",
        isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
      )}>
        <h1 className={cn(
          "text-lg font-semibold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Referral Program
        </h1>
        <Users className={cn(
          "w-6 h-6",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )} />
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className={cn(
            "p-4 rounded-lg border",
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "text-xs font-medium",
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                )}>
                  Total Referrals
                </p>
                <p className={cn(
                  "text-2xl font-bold",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  {referralStats.totalReferrals}
                </p>
              </div>
              <Users className={cn(
                "w-8 h-8",
                isDarkMode ? "text-blue-400" : "text-blue-500"
              )} />
            </div>
          </div>

          <div className={cn(
            "p-4 rounded-lg border",
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "text-xs font-medium",
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                )}>
                  Total Earnings
                </p>
                <p className={cn(
                  "text-2xl font-bold",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  ${referralStats.totalEarnings}
                </p>
              </div>
              <Gift className={cn(
                "w-8 h-8",
                isDarkMode ? "text-green-400" : "text-green-500"
              )} />
            </div>
          </div>
        </div>

        {/* Referral Code Section */}
        <div className={cn(
          "p-4 rounded-lg border",
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <h3 className={cn(
            "font-semibold mb-3",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Your Referral Code
          </h3>
          <div className="flex items-center gap-2 mb-4">
            <div className={cn(
              "flex-1 p-3 rounded-lg border font-mono text-lg font-bold text-center",
              isDarkMode 
                ? "bg-gray-700 border-gray-600 text-white" 
                : "bg-gray-50 border-gray-300 text-gray-900"
            )}>
              {referralCode}
            </div>
            <button
              onClick={handleCopyCode}
              className={cn(
                "p-3 rounded-lg border transition-colors",
                copied
                  ? "border-green-500 bg-green-50"
                  : isDarkMode
                  ? "border-gray-600 hover:bg-gray-700"
                  : "border-gray-300 hover:bg-gray-50"
              )}
            >
              {copied ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
          <button
            onClick={handleShare}
            className={cn(
              "w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
              isDarkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            )}
          >
            <Share2 className="w-4 h-4" />
            Share Referral Link
          </button>
        </div>

        {/* How It Works */}
        <div className={cn(
          "p-4 rounded-lg border",
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <h3 className={cn(
            "font-semibold mb-3",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            How It Works
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                isDarkMode ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
              )}>
                1
              </div>
              <p className={cn(
                "text-sm",
                isDarkMode ? "text-gray-300" : "text-gray-600"
              )}>
                Share your referral code with friends
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                isDarkMode ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
              )}>
                2
              </div>
              <p className={cn(
                "text-sm",
                isDarkMode ? "text-gray-300" : "text-gray-600"
              )}>
                They sign up using your code
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                isDarkMode ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
              )}>
                3
              </div>
              <p className={cn(
                "text-sm",
                isDarkMode ? "text-gray-300" : "text-gray-600"
              )}>
                You both earn $30 when they complete their first task
              </p>
            </div>
          </div>
        </div>

        {/* Referral History */}
        <div className={cn(
          "p-4 rounded-lg border",
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <h3 className={cn(
            "font-semibold mb-3",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Referral History
          </h3>
          <div className="space-y-3">
            {referralHistory.map((referral) => (
              <div
                key={referral.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  isDarkMode ? "border-gray-600" : "border-gray-200"
                )}
              >
                <div className="flex-1">
                  <p className={cn(
                    "font-medium text-sm",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>
                    {referral.name}
                  </p>
                  <p className={cn(
                    "text-xs",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}>
                    {referral.email}
                  </p>
                  <p className={cn(
                    "text-xs",
                    isDarkMode ? "text-gray-500" : "text-gray-500"
                  )}>
                    {new Date(referral.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "inline-block px-2 py-1 rounded-full text-xs font-medium",
                    getStatusColor(referral.status)
                  )}>
                    {referral.status}
                  </span>
                  {referral.earnings > 0 && (
                    <p className={cn(
                      "text-sm font-medium mt-1",
                      isDarkMode ? "text-green-400" : "text-green-600"
                    )}>
                      +${referral.earnings}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 
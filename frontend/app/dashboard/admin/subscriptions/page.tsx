"use client";

import React, { useEffect, useState } from "react";
import {
  getMySubscription,
  updateAutoRenew,
} from "@/lib/subscription/subscriptionService";
import { UISubscription } from "@/lib/subscription/subscriptionMapper";

const SubscriptionPage = () => {

  const [subscription, setSubscription] =
    useState<UISubscription | null>(null);

  const [loading, setLoading] = useState(true);

  // FETCH DATA
  const loadSubscription = async () => {
    try {
      const data = await getMySubscription();
      setSubscription(data[0]); // backend bisa kirim array
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, []);

  // AUTO RENEW HANDLER
  const handleAutoRenew = async (value: boolean) => {
    try {
      await updateAutoRenew(value);
      await loadSubscription();
    } catch (err) {
      console.error(err);
      alert("Failed to update auto renew");
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!subscription) {
    return <div className="p-8">No active subscription</div>;
  }

  return (
    <div className="p-8">

      <h1 className="text-2xl font-bold text-gray-800 mb-8">
        Subscriptions
      </h1>

      <div className="max-w-xl bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">

        {/* HEADER */}
        <div className="bg-[#4a7ab5] py-3 px-6 text-center">
          <h2 className="text-white font-semibold text-lg">
            Information about your plan
          </h2>
        </div>

        <div className="p-8">

          {/* BADGES */}
          <div className="flex justify-between items-start mb-4">
            <span className="bg-[#e09e1e] text-white px-4 py-1 rounded-full text-sm font-medium italic shadow-sm">
              {subscription.planName}
            </span>

            <span className="bg-[#2a4d6e] text-white px-6 py-1 rounded-full text-sm font-medium italic">
              {subscription.status}
            </span>
          </div>

          {/* TITLE */}
          <div className="mb-6">
            <h3 className="text-3xl font-bold italic text-gray-800 mb-1">
              {subscription.planName} Subscription
            </h3>

            <p className="text-gray-600">
              {subscription.maxEmployeesLabel}
            </p>
          </div>

          {/* PROGRESS */}
          <div className="mb-10">

            <div className="flex justify-end mb-2">
              <span className="text-sm font-bold italic text-gray-800">
                {subscription.remainingDays} days left
              </span>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-4 border border-gray-300">
              <div
                className="bg-[#4a7ab5] h-full rounded-full transition-all"
                style={{
                  width: `${subscription.progressPercent}%`,
                }}
              ></div>
            </div>

            <div className="flex justify-between mt-2 text-xs font-medium text-gray-500">
              <span>{subscription.startDateLabel}</span>
              <span>{subscription.endDateLabel}</span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 justify-center">

            <button
              onClick={() => handleAutoRenew(false)}
              className="flex-1 px-6 py-3 border-2 border-[#2a4d6e] text-[#2a4d6e] font-bold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Stop Subscription
            </button>

            <button
              onClick={() => handleAutoRenew(true)}
              className="flex-1 px-6 py-3 bg-[#2a4d6e] text-white font-bold rounded-lg hover:bg-[#1f3a54] transition-colors"
            >
              Renew Subscription
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;

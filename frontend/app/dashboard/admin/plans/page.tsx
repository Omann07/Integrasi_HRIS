"use client";

import { useEffect, useState } from "react";
import { getSubscriptionPlans, getPaygoPlans } from "@/lib/plan/planService";
import { createTransaction } from "@/lib/plan/planService";
import { PlanUI } from "@/lib/plan/planMapper";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<
    "subscription" | "paygo"
  >("subscription");

  const [plans, setPlans] = useState<PlanUI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanUI | null>(null);
  const [processing, setProcessing] = useState(false);

  // ================= FETCH PLANS =================

  useEffect(() => {
    fetchPlans();
  }, [billingCycle]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        billingCycle === "subscription"
          ? await getSubscriptionPlans()
          : await getPaygoPlans();

      setPlans(data);
    } catch (err) {
      console.error("Fetch plans error:", err);
      setError("Failed to load pricing plans");
    } finally {
      setLoading(false);
    }
  };

  // ================= SELECT PLAN =================

  const handleSelectPlan = (plan: PlanUI) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  // ================= BUY PACKAGE =================

  const handleBuyPackage = async () => {
    if (!selectedPlan) return;

    try {
      setProcessing(true);

      const result = await createTransaction(selectedPlan.id);

      console.log("PAYMENT RESULT:", result);

      // redirect ke payment gateway
      if (result.invoiceUrl) {
        window.location.href = result.invoiceUrl;
      } else {
        alert("Invoice URL not found");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to process payment");
    } finally {
      setProcessing(false);
      setIsModalOpen(false);
    }
  };

  // ================= UI =================

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-12 px-4 font-sans text-slate-700">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-red-800 mb-4">
          HRIS Pricing Plans
        </h1>

        <p className="max-w-2xl mx-auto text-sm mb-8 text-slate-600">
          Choose the plan that best suits your business!
        </p>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white p-1 rounded-full border-2 border-slate-300 flex items-center shadow-sm">
            <button
              onClick={() => setBillingCycle("subscription")}
              className={`px-8 py-2 rounded-full transition-all ${
                billingCycle === "subscription"
                  ? "bg-slate-700 text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Subscription
            </button>

            <button
              onClick={() => setBillingCycle("paygo")}
              className={`px-8 py-2 rounded-full transition-all ${
                billingCycle === "paygo"
                  ? "bg-slate-700 text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Pay as you go
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 text-red-600 font-medium">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="py-20 text-center text-slate-600">
            Loading pricing plans...
          </div>
        )}

        {/* EMPTY */}
        {!loading && plans.length === 0 && (
          <div className="py-20 text-center text-slate-600">
            No plans available
          </div>
        )}

        {/* PLANS */}
        {!loading && plans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 border border-slate-200 shadow-xl transition-transform hover:scale-105 flex flex-col ${
                  index === 1
                    ? "bg-slate-700 text-white"
                    : "bg-white/70"
                }`}
              >
                {/* Badge */}
                <span
                  className={`absolute top-4 right-4 text-xs text-white px-4 py-1 rounded-full italic font-medium ${
                    index === 1
                      ? "bg-orange-500"
                      : "bg-slate-400"
                  }`}
                >
                  {plan.name}
                </span>

                <div className="text-left mt-4 flex-grow">
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-lg font-bold">IDR</span>
                    <span className="text-4xl font-extrabold">
                      {plan.price}
                    </span>
                    {billingCycle === "subscription" && (
                      <span className="text-sm">/month</span>
                    )}
                  </div>

                  <p className="text-xs border-b border-slate-300 pb-4 mb-4 opacity-80">
                    {plan.description}
                  </p>

                  <h3 className="italic font-bold text-lg mb-4">
                    {plan.limit}
                  </h3>

                  <ul className="space-y-3 text-sm">
                    {Array.isArray(plan.features) &&
                      plan.features.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-current shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={`mt-8 w-full py-3 rounded-xl font-bold transition-colors ${
                    index === 1
                      ? "bg-white text-slate-700 hover:bg-slate-100"
                      : "bg-slate-600 text-white hover:bg-slate-700"
                  }`}
                >
                  Select Plan
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= MODAL ================= */}

      {isModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              Are you sure you want to buy this <br />
              <span className="text-slate-900">
                {billingCycle === "subscription"
                  ? "Subscription"
                  : "PayGo"}{" "}
                package?
              </span>
            </h2>

            {billingCycle === "subscription" && (
              <div className="mb-8">
                <p className="text-red-600 font-bold text-sm mb-1 uppercase">
                  Attention!!
                </p>
                <p className="text-red-500 text-xs">
                  If you buy a Subscription package, the active PayGo package will expire.
                </p>
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={processing}
                className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-400 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={handleBuyPackage}
                disabled={processing}
                className="flex-1 py-3 bg-[#24446a] text-white rounded-xl font-bold hover:bg-[#1a3350] shadow-lg"
              >
                {processing ? "Processing..." : "Buy Package"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

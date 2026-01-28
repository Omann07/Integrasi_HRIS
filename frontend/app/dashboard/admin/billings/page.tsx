"use client";

import React, { useEffect, useState } from "react";
import { Eye, Search } from "lucide-react";

import {
  getBillingTransactions,
} from "@/lib/transaction/transactionService";

import { TransactionUI } from "@/lib/transaction/transactionMapper";

export default function BillingPage() {

  const [data, setData] = useState<TransactionUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchBilling();
  }, []);

  const fetchBilling = async () => {
    try {
      const res = await getBillingTransactions();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter((item) =>
    item.planName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      <div className="bg-white rounded-2xl shadow-sm border p-8">

        <div className="flex justify-between mb-6">

          <h2 className="text-xl font-bold">Billing Pending</h2>

          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search plan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 pl-10 text-sm"
            />
            <Search className="absolute left-3 top-2.5" size={16} />
          </div>

        </div>

        {loading ? (
          <div className="text-center py-8">Loading billing...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8">No billing found</div>
        ) : (

          <table className="w-full">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="p-4">No</th>
                <th className="p-4">Date</th>
                <th className="p-4">Type</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Amount</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>

              {filteredData.map((item, i) => (

                <tr key={item.id} className="border-b">

                  <td className="p-4">{i + 1}</td>
                  <td className="p-4">{item.date}</td>
                  <td className="p-4">{item.type}</td>
                  <td className="p-4">{item.planName}</td>
                  <td className="p-4">{item.amount}</td>

                  <td className="p-4 text-center">
                    <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded text-xs font-bold">
                      {item.status}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    {item.invoiceUrl && (
                      <button
                        onClick={() =>
                          window.open(item.invoiceUrl!, "_blank")
                        }
                        className="bg-blue-600 text-white px-4 py-1 rounded"
                      >
                        Pay Now
                      </button>
                    )}
                  </td>

                </tr>

              ))}

            </tbody>
          </table>

        )}

      </div>

    </div>
  );
}

import React from 'react';
import { calculateSummary, formatCurrency, formatPercentage } from '../utils/calculations';

const Summary = ({ data }) => {
  const summary = calculateSummary(data);

  const SummarySection = ({ title, data, className = '' }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-blue-600">סה"כ הכנסות</div>
          <div className="text-2xl font-bold text-blue-900">
            {formatCurrency(data.totalRevenue)}
          </div>
          <div className="text-sm text-blue-600">
            {formatCurrency(data.totalRevenueExclVat)} (לפני מע"מ)
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-green-600">סה"כ רווח</div>
          <div className="text-2xl font-bold text-green-900">
            {formatCurrency(data.totalProfit)}
          </div>
          <div className="text-sm text-green-600">
            {formatCurrency(data.totalProfitExclVat)} (לפני מע"מ)
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-purple-600">אחוז רווחיות</div>
          <div className="text-2xl font-bold text-purple-900">
            {formatPercentage(data.profitPercent)}
          </div>
          <div className="text-sm text-purple-600">
            {formatPercentage(data.profitPercentExclVat)} (לפני מע"מ)
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SummarySection 
          title="לפני קלט ידני" 
          data={summary.beforeManualInput}
        />
        <SummarySection 
          title="לאחר קלט ידני" 
          data={summary.afterManualInput}
          className="border-2 border-primary-200"
        />
      </div>
    </div>
  );
};

export default Summary;

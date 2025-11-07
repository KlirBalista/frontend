"use client";

import { useState } from 'react';
import axios from '@/lib/axios';

export default function DiscountModal({ 
    isOpen, 
    onClose, 
    birthcareId, 
    bill,
    onSuccess 
}) {
    const [discountType, setDiscountType] = useState('amount'); // 'amount' or 'percentage'
    const [discountAmount, setDiscountAmount] = useState('');
    const [discountPercentage, setDiscountPercentage] = useState('');
    const [discountReason, setDiscountReason] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!discountReason.trim()) {
            alert('Please provide a reason for the discount');
            return;
        }

        if (discountType === 'amount' && (!discountAmount || parseFloat(discountAmount) <= 0)) {
            alert('Please provide a valid discount amount');
            return;
        }

        if (discountType === 'percentage' && (!discountPercentage || parseFloat(discountPercentage) <= 0 || parseFloat(discountPercentage) > 100)) {
            alert('Please provide a valid discount percentage (1-100)');
            return;
        }

        setLoading(true);

        try {
            const requestData = {
                bill_id: bill.id,
                discount_reason: discountReason,
                notes: notes
            };

            if (discountType === 'amount') {
                requestData.discount_amount = parseFloat(discountAmount);
            } else {
                requestData.discount_percentage = parseFloat(discountPercentage);
                requestData.discount_amount = 0; // Will be calculated by backend
            }

            const response = await axios.post(
                `/api/birthcare/${birthcareId}/patient-charges/apply-discount`,
                requestData
            );

            if (response.data.success) {
                onSuccess(response.data.data);
                onClose();
            }
        } catch (error) {
            console.error('Error applying discount:', error);
            alert('Failed to apply discount: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setDiscountType('amount');
        setDiscountAmount('');
        setDiscountPercentage('');
        setDiscountReason('');
        setNotes('');
        onClose();
    };

    if (!isOpen || !bill) return null;

    const calculatedDiscount = discountType === 'percentage' && discountPercentage 
        ? (bill.subtotal * parseFloat(discountPercentage)) / 100 
        : parseFloat(discountAmount) || 0;

    const newTotal = Math.max(0, bill.total_amount - calculatedDiscount);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Apply Discount</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Bill Information */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Bill Information</h3>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p>Bill Number: <span className="font-medium text-gray-900">{bill.bill_number}</span></p>
                                <p>Subtotal: <span className="font-medium text-gray-900">₱{bill.subtotal?.toLocaleString()}</span></p>
                                <p>Current Total: <span className="font-medium text-gray-900">₱{bill.total_amount?.toLocaleString()}</span></p>
                                <p>Current Discount: <span className="font-medium text-gray-900">₱{bill.discount_amount?.toLocaleString()}</span></p>
                            </div>
                        </div>

                        {/* Discount Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Discount Type
                            </label>
                            <div className="flex space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="amount"
                                        checked={discountType === 'amount'}
                                        onChange={(e) => setDiscountType(e.target.value)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Fixed Amount</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="percentage"
                                        checked={discountType === 'percentage'}
                                        onChange={(e) => setDiscountType(e.target.value)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Percentage</span>
                                </label>
                            </div>
                        </div>

                        {/* Discount Value */}
                        {discountType === 'amount' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Discount Amount (₱)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={bill.subtotal}
                                    value={discountAmount}
                                    onChange={(e) => setDiscountAmount(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter discount amount"
                                    required
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Discount Percentage (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={discountPercentage}
                                    onChange={(e) => setDiscountPercentage(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter discount percentage"
                                    required
                                />
                            </div>
                        )}

                        {/* Discount Reason */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Discount Reason *
                            </label>
                            <select
                                value={discountReason}
                                onChange={(e) => setDiscountReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select a reason</option>
                                <option value="Senior Citizen Discount">Senior Citizen Discount</option>
                                <option value="PWD Discount">PWD Discount</option>
                                <option value="PhilHealth Coverage">PhilHealth Coverage</option>
                                <option value="Insurance Coverage">Insurance Coverage</option>
                                <option value="Promotional Discount">Promotional Discount</option>
                                <option value="Goodwill Discount">Goodwill Discount</option>
                                <option value="Staff Discount">Staff Discount</option>
                                <option value="Payment Plan Incentive">Payment Plan Incentive</option>
                                <option value="Financial Hardship">Financial Hardship</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Additional Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Notes
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add any additional notes about this discount..."
                            />
                        </div>

                        {/* Discount Preview */}
                        {(discountAmount || discountPercentage) && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-medium text-blue-900 mb-2">Discount Preview</h4>
                                <div className="space-y-1 text-sm text-blue-800">
                                    <p>Discount Amount: <span className="font-medium">₱{calculatedDiscount.toLocaleString()}</span></p>
                                    <p>New Total: <span className="font-medium">₱{newTotal.toLocaleString()}</span></p>
                                    <p>Savings: <span className="font-medium">₱{(bill.total_amount - newTotal).toLocaleString()}</span></p>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !discountReason || (!discountAmount && !discountPercentage)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Applying...' : 'Apply Discount'}
                    </button>
                </div>
            </div>
        </div>
    );
}

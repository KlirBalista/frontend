'use client';

const PaymentMethodSelector = ({ selectedMethod, onMethodSelect, includeInsurance = false, showTitle = true }) => {
  const basicPaymentMethods = [
    {
      id: 'cash',
      name: 'Cash',
      description: 'Cash payment',
      icon: (
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      color: 'border-green-500 bg-green-50',
      category: 'basic'
    },
    {
      id: 'credit_card',
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, etc.',
      icon: (
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
      ),
      color: 'border-gray-500 bg-gray-50',
      category: 'basic'
    },
    {
      id: 'gcash',
      name: 'GCash',
      description: 'Pay with your GCash wallet',
      icon: (
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">G</span>
        </div>
      ),
      color: 'border-blue-500 bg-blue-50',
      category: 'basic'
    }
  ];

  const insurancePaymentMethods = [
    {
      id: 'philhealth',
      name: 'PhilHealth',
      description: 'Philippine Health Insurance',
      icon: (
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
      ),
      color: 'border-blue-500 bg-blue-50',
      category: 'insurance'
    },
    {
      id: 'dswd',
      name: 'DSWD',
      description: 'Department of Social Welfare and Development',
      icon: (
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20a3 3 0 01-3-3v-2a3 3 0 013-3h3a3 3 0 013 3v2a3 3 0 01-3 3H7zm8-10a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      ),
      color: 'border-green-500 bg-green-50',
      category: 'insurance'
    },
    {
      id: 'doh',
      name: 'DOH',
      description: 'Department of Health',
      icon: (
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
      ),
      color: 'border-purple-500 bg-purple-50',
      category: 'insurance'
    },
    {
      id: 'hmo',
      name: 'HMO',
      description: 'Health Maintenance Organization',
      icon: (
        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      ),
      color: 'border-indigo-500 bg-indigo-50',
      category: 'insurance'
    },
    {
      id: 'private',
      name: 'Private Pay',
      description: 'Self-pay/Out of pocket',
      icon: (
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      ),
      color: 'border-gray-500 bg-gray-50',
      category: 'insurance'
    },
    {
      id: 'others',
      name: 'Others',
      description: 'Other insurance or payment method',
      icon: (
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      ),
      color: 'border-orange-500 bg-orange-50',
      category: 'insurance'
    }
  ];

  const paymentMethods = includeInsurance 
    ? [...basicPaymentMethods, ...insurancePaymentMethods]
    : basicPaymentMethods;

  // Group methods by category if insurance is included
  const basicMethods = paymentMethods.filter(method => method.category === 'basic');
  const insuranceMethods = paymentMethods.filter(method => method.category === 'insurance');

  return (
    <div className="space-y-6">
      {showTitle && (
        <h3 className="text-lg font-semibold text-gray-900">
          {includeInsurance ? 'Choose Payment Method & Insurance' : 'Choose Payment Method'}
        </h3>
      )}
      
      {/* Basic Payment Methods */}
      {basicMethods.length > 0 && (
        <div className="space-y-3">
          {includeInsurance && (
            <h4 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-2">
              Payment Methods
            </h4>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {basicMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => onMethodSelect(method.id)}
                className={`p-4 border-2 rounded-xl transition-all duration-200 text-left hover:shadow-md ${
                  selectedMethod === method.id
                    ? `${method.color} border-opacity-100 shadow-md`
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {method.icon}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{method.name}</p>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                  {selectedMethod === method.id && (
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-current" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Insurance Methods */}
      {includeInsurance && insuranceMethods.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-2 flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Insurance Coverage Options
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insuranceMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => onMethodSelect(method.id)}
                className={`p-4 border-2 rounded-xl transition-all duration-200 text-left hover:shadow-md ${
                  selectedMethod === method.id
                    ? `${method.color} border-opacity-100 shadow-md`
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {method.icon}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{method.name}</p>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                  {selectedMethod === method.id && (
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-current" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Information note when insurance is included */}
      {includeInsurance && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">Insurance Coverage</p>
              <p className="text-sm text-blue-700 mt-1">
                Select the appropriate insurance coverage or payment method. For insurance claims, 
                ensure all necessary documentation is available before processing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
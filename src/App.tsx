import { useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import './App.css'

interface Service {
  id: string
  name: string
  description: string
  price: number
  mccCode: string
  merchantType: string
}

const services: Service[] = [
  { id: '1', name: 'Body Paint', description: 'Professional paint job', price: 1499.99, mccCode: '7531', merchantType: 'Auto Body Repair Shops' },
  { id: '2', name: 'Dent Removal', description: 'Minor dent repair', price: 199.99, mccCode: '7531', merchantType: 'Auto Body Repair Shops' },
  { id: '3', name: 'Premium Tires', description: 'Set of 4 premium tires', price: 799.99, mccCode: '5532', merchantType: 'Automotive Tire Stores' },
  { id: '4', name: 'Tire Rotation', description: 'All four tires rotated and balanced', price: 39.99, mccCode: '5532', merchantType: 'Automotive Tire Stores' },
  { id: '5', name: 'Oil Change', description: 'Full synthetic oil change', price: 49.99, mccCode: '7538', merchantType: 'Auto Service Shops' },
  { id: '6', name: 'Brake Repair', description: 'Brake pads replacement', price: 299.99, mccCode: '7538', merchantType: 'Auto Service Shops' },
]

function App() {
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [processing, setProcessing] = useState(false)

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const calculateTotal = () => {
    return services
      .filter(service => selectedServices.includes(service.id))
      .reduce((sum, service) => sum + service.price, 0)
  }

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '')
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned
    return formatted.slice(0, 19) // 16 digits + 3 spaces
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '')
    if (/^\d*$/.test(value) && value.length <= 16) {
      setCardNumber(formatCardNumber(value))
    }
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 4) {
      const formatted = value.length >= 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value
      setExpiryDate(formatted)
    }
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 3) {
      setCvv(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service')
      return
    }

    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      toast.error('Please fill in all card details')
      return
    }

    setProcessing(true)
    
    // Show processing toast
    const toastId = toast.loading('Processing payment...')
    
    try {
      // Parse expiry date (MM/YY)
      const [expiryMonth, expiryYear] = expiryDate.split('/')
      
      // Remove spaces from card number
      const cleanCardNumber = cardNumber.replace(/\s/g, '')
      
      // Get the MCC code from the first selected service
      const firstSelectedService = services.find(s => selectedServices.includes(s.id))
      const mccCode = firstSelectedService?.mccCode || '7531'
      
      // Prepare payment payload
      const payload = {
        cardNumber: cleanCardNumber,
        cvv: cvv,
        amount: calculateTotal(),
        mccCode: mccCode,
        expiryMonth: expiryMonth,
        expiryYear: expiryYear
      }

      console.log('Sending payment request:', payload)

      const response = await fetch('https://sea-lion-app-beet7.ondigitalocean.app/revv/api/v1/card-authorization/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      
      toast.dismiss(toastId)
      
      console.log('Payment response:', data)
      
      // Check the status field in the response body
      if (data.status === 'APPROVED') {
        toast.success(
          `Payment Approved!\n${data.responseMessage || `Amount: $${calculateTotal().toFixed(2)}`}`,
          {
            duration: 5000,
          }
        )
        // Reset form on success
        setSelectedServices([])
        setCardNumber('')
        setCardName('')
        setExpiryDate('')
        setCvv('')
      } else {
        // Payment declined or failed
        toast.error(
          `Payment ${data.status || 'Failed'}\n${data.responseMessage || 'Unknown error'}`,
          {
            duration: 6000,
          }
        )
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.dismiss(toastId)
      toast.error(`Payment error: ${error instanceof Error ? error.message : 'Network error occurred'}`, {
        duration: 6000,
      })
    } finally {
      setProcessing(false)
    }
  }

  const total = calculateTotal()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Toaster
        position="top-center"
        toastOptions={{
          success: {
            style: {
              background: '#10b981',
              color: '#fff',
              maxWidth: '90vw',
            },
          },
          error: {
            style: {
              background: '#ef4444',
              color: '#fff',
              maxWidth: '90vw',
            },
          },
          loading: {
            style: {
              background: '#3b82f6',
              color: '#fff',
              maxWidth: '90vw',
            },
          },
        }}
      />
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
        {/* Header */}
        <header className="text-center mb-8 sm:mb-12 pt-4 sm:pt-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3">
            🔧 RevvAuto Shop
          </h1>
          <p className="text-slate-300 text-base sm:text-lg px-4">
            Professional Auto Body Repair & Maintenance
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Services Section */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6">
              Select Services
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {services.map(service => (
                <div
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                    selectedServices.includes(service.id)
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.id)}
                          onChange={() => {}}
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded accent-blue-500 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-800 text-base sm:text-lg">
                            {service.name}
                          </h3>
                          <p className="text-slate-600 text-xs sm:text-sm">
                            {service.description}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                            {service.merchantType} (MCC: {service.mccCode})
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-blue-600 text-base sm:text-lg ml-2 flex-shrink-0">
                      ${service.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t-2 border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-xl sm:text-2xl font-bold text-slate-800">Total:</span>
                <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6">
              Payment Details
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Card Number */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none text-base sm:text-lg"
                  required
                />
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none text-base sm:text-lg"
                  required
                />
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none text-base sm:text-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={handleCvvChange}
                    placeholder="123"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none text-base sm:text-lg"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing}
                className={`w-full py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-all duration-200 ${
                  processing
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-lg hover:shadow-xl'
                }`}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Pay $${total.toFixed(2)}`
                )}
              </button>

              {selectedServices.length === 0 && (
                <p className="text-center text-sm text-slate-500">
                  Please select at least one service to proceed
                </p>
              )}
            </form>

            {/* Security Badge */}
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200">
              <div className="flex items-center justify-center gap-2 text-slate-600">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span className="text-xs sm:text-sm">Secure Payment Gateway</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 sm:mt-12 pb-6 text-slate-400 text-xs sm:text-sm px-4">
          <p>© 2025 RevvAuto Shop. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}

export default App

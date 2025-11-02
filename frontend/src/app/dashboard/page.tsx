'use client'

import { useState, useEffect } from 'react'
import { 
  ShieldCheckIcon, 
  XCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { api } from '@/lib/api'
import {
  ConsentState,
  ConsentStatus,
  ConsentGrantRequest,
  LegalBasis
} from '@consentire/shared'

export default function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null)
  const [consents, setConsents] = useState<ConsentState[]>([])
  const [showGrantForm, setShowGrantForm] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Initialize user (in production, handle authentication)
    const storedUserId = localStorage.getItem('userId')
    if (!storedUserId) {
      // Simulate user registration
      handleRegister()
    } else {
      setUserId(storedUserId)
      loadConsents(storedUserId)
    }
  }, [])

  const handleRegister = async () => {
    try {
      const response = await api.post('/users/register', {
        email: `user_${Date.now()}@example.com`,
        publicKey: `pk_${Date.now()}`
      })
      const userId = response.data.userId
      localStorage.setItem('userId', userId)
      setUserId(userId)
      loadConsents(userId)
    } catch (error) {
      console.error('Registration failed:', error)
    }
  }

  const loadConsents = async (uid: string) => {
    try {
      const response = await api.get(`/consent/user/${uid}`)
      setConsents(response.data.consents || [])
    } catch (error) {
      console.error('Failed to load consents:', error)
    }
  }

  const handleGrantConsent = async (data: ConsentGrantRequest) => {
    setLoading(true)
    try {
      const response = await api.post('/consent/grant', data)
      await loadConsents(userId!)
      setShowGrantForm(false)
      alert('Consent granted successfully!')
    } catch (error: any) {
      alert(`Failed to grant consent: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeConsent = async (consentId: string) => {
    if (!confirm('Are you sure you want to revoke this consent?')) return
    
    setLoading(true)
    try {
      await api.post(`/consent/revoke/${consentId}`, {
        userId,
        signature: `sig_${Date.now()}`
      })
      await loadConsents(userId!)
      alert('Consent revoked successfully!')
    } catch (error: any) {
      alert(`Failed to revoke consent: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">ConsenTide Dashboard</h1>
            </div>
            <div className="text-sm text-gray-600">
              User ID: {userId ? userId.substring(0, 16) + '...' : 'Loading...'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">My Consents</h2>
          <button
            onClick={() => setShowGrantForm(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Grant New Consent</span>
          </button>
        </div>

        {/* Consents List */}
        {consents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">You haven't granted any consents yet.</p>
            <button
              onClick={() => setShowGrantForm(true)}
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Grant your first consent →
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {consents.map((consent) => (
              <ConsentCard
                key={consent.consentId}
                consent={consent}
                onRevoke={handleRevokeConsent}
              />
            ))}
          </div>
        )}

        {/* Grant Consent Form */}
        {showGrantForm && (
          <GrantConsentForm
            userId={userId!}
            onSubmit={handleGrantConsent}
            onCancel={() => setShowGrantForm(false)}
            loading={loading}
          />
        )}
      </main>
    </div>
  )
}

function ConsentCard({ 
  consent, 
  onRevoke 
}: { 
  consent: ConsentState, 
  onRevoke: (id: string) => void 
}) {
  const getStatusIcon = (status: ConsentStatus) => {
    switch (status) {
      case ConsentStatus.GRANTED:
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />
      case ConsentStatus.REVOKED:
        return <XCircleIcon className="h-6 w-6 text-red-500" />
      case ConsentStatus.EXPIRED:
        return <ClockIcon className="h-6 w-6 text-yellow-500" />
      default:
        return <ClockIcon className="h-6 w-6 text-gray-500" />
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {getStatusIcon(consent.status)}
            <span className="font-semibold text-gray-900 capitalize">{consent.status}</span>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Consent ID:</strong> {consent.consentId.substring(0, 16)}...</p>
            <p><strong>Controller Hash:</strong> {consent.controllerHash.substring(0, 16)}...</p>
            <p><strong>Purpose Hash:</strong> {consent.purposeHash.substring(0, 16)}...</p>
            <p><strong>Granted:</strong> {formatDate(consent.grantedAt)}</p>
            {consent.expiresAt && (
              <p><strong>Expires:</strong> {formatDate(consent.expiresAt)}</p>
            )}
            <p><strong>HGTP TX Hash:</strong> {consent.hgtpTxHash.substring(0, 16)}...</p>
          </div>
        </div>
        {consent.status === ConsentStatus.GRANTED && (
          <button
            onClick={() => onRevoke(consent.consentId)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
          >
            Revoke
          </button>
        )}
      </div>
    </div>
  )
}

function GrantConsentForm({ 
  userId, 
  onSubmit, 
  onCancel, 
  loading 
}: { 
  userId: string, 
  onSubmit: (data: ConsentGrantRequest) => void,
  onCancel: () => void,
  loading: boolean
}) {
  const [formData, setFormData] = useState({
    controllerId: '',
    purpose: '',
    dataCategories: [] as string[],
    lawfulBasis: LegalBasis.CONSENT,
    expiresAt: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      userId,
      controllerId: formData.controllerId,
      purpose: formData.purpose,
      dataCategories: formData.dataCategories,
      lawfulBasis: formData.lawfulBasis,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).getTime() : undefined,
      signature: `sig_${Date.now()}`
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Grant New Consent</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Controller ID
            </label>
            <input
              type="text"
              required
              value={formData.controllerId}
              onChange={(e) => setFormData({ ...formData, controllerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Organization identifier"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose
            </label>
            <textarea
              required
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Data processing purpose"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lawful Basis
            </label>
            <select
              value={formData.lawfulBasis}
              onChange={(e) => setFormData({ ...formData, lawfulBasis: e.target.value as LegalBasis })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {Object.values(LegalBasis).map((basis) => (
                <option key={basis} value={basis}>{basis}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiration Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? 'Granting...' : 'Grant Consent'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

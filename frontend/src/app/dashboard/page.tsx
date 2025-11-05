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
import { createClient } from '@/lib/supabase'
import {
  ConsentState,
  ConsentStatus,
  ConsentGrantRequest,
  LegalBasis
} from '@consentire/shared'

export default function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('user')
  const [consents, setConsents] = useState<ConsentState[]>([])
  const [showGrantForm, setShowGrantForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      const accessToken = data.session?.access_token

      if (!data.session) {
        setSignedIn(false)
        return
      }

      if (accessToken) {
        localStorage.setItem('token', accessToken)
      }

      setSignedIn(true)
      const uid = data.session.user.id
      setUserId(uid)

      // Get user role from metadata
      const sessionUserRole = data.session.user.app_metadata?.role ||
                             data.session.user.user_metadata?.role || 'user'
      setUserRole(sessionUserRole)

      // Auto-register user if not exists
      try {
        await api.get('/users/me/profile')
      } catch {
        await api.post('/users/register', {
          email: data.session.user.email || `${uid}@consentire.local`,
          publicKey: `supabase:${uid}`,
          role: sessionUserRole
        })
      }

      await loadConsents()
    }
    init()
  }, [])

  const supabaseSignIn = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
  }

  const handleEmailSignIn = () => {
    window.location.href = '/login'
  }

  const loadConsents = async () => {
    try {
      const response = await api.get(`/consent/user/me`)
      const rows = response.data.consents || []
      const mapped: ConsentState[] = rows.map((r: any) => ({
        consentId: r.id,
        controllerHash: r.controller_hash,
        purposeHash: r.purpose_hash,
        status: r.status,
        grantedAt: new Date(r.granted_at).getTime(),
        expiresAt: r.expires_at ? new Date(r.expires_at).getTime() : undefined,
        hgtpTxHash: r.hgtp_tx_hash || '',
        userId: r.user_id,
      }))
      setConsents(mapped)
    } catch (error) {
      console.error('Failed to load consents:', error)
    }
  }

  const handleGrantConsent = async (data: ConsentGrantRequest) => {
    setLoading(true)
    try {
      await api.post('/consent/grant', data)
      await loadConsents()
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
      await loadConsents()
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
              <h1 className="text-2xl font-bold text-gray-900">consentire Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {signedIn && (
                <div className="text-sm text-gray-600">
                  {userRole === 'user' ? 'Individual' : userRole === 'organization' ? 'Organization' : 'Regulator'} User: {userId?.substring(0, 16)}...
                </div>
              )}
              {signedIn && (
                <button
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    window.location.reload()
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!signedIn && (
          <div className="bg-white rounded-lg shadow p-8 text-center mb-6">
            <ShieldCheckIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to ConsenTide</h2>
            <p className="text-gray-700 mb-6">Sign in to manage your GDPR consents with zero-knowledge privacy.</p>
            <div className="space-y-3">
              <button onClick={handleEmailSignIn} className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                Sign in with Email
              </button>
              <button onClick={supabaseSignIn} className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition">
                Sign in with GitHub
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              New user? <a href="/register" className="text-blue-600 hover:text-blue-800">Create an account</a>
            </p>
          </div>
        )}

        {/* Actions */}
        {signedIn && (
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {userRole === 'user' ? 'My Consents' :
                 userRole === 'organization' ? 'Consent Management' :
                 'Compliance Oversight'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {userRole === 'user' ? 'Manage your GDPR consent permissions across organizations' :
                 userRole === 'organization' ? 'Manage customer consents and compliance' :
                 'Monitor compliance across organizations and jurisdictions'}
              </p>
            </div>
            {userRole !== 'regulator' && (
              <button
                onClick={() => setShowGrantForm(true)}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition flex items-center space-x-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>
                  {userRole === 'user' ? 'Grant New Consent' : 'Add Consent Record'}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Consents List */}
        {signedIn && consents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">
              {userRole === 'user' ? "You haven't granted any consents yet." :
               userRole === 'organization' ? "No consent records found." :
               "No compliance data available."}
            </p>
            {userRole !== 'regulator' && (
              <button
                onClick={() => setShowGrantForm(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
              >
                {userRole === 'user' ? 'Grant Consent' : 'Add Record'}
              </button>
            )}
          </div>
        ) : signedIn ? (
          <div className="grid gap-4">
            {consents.map((consent) => (
              <ConsentCard
                key={consent.consentId}
                consent={consent}
                onRevoke={handleRevokeConsent}
                userRole={userRole}
              />
            ))}
          </div>
        ) : (
          <div />
        )}

        {/* Grant Consent Form */}
        {signedIn && showGrantForm && (
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
  onRevoke,
  userRole
}: {
  consent: ConsentState,
  onRevoke: (id: string) => void,
  userRole: string
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
        {consent.status === ConsentStatus.GRANTED && userRole === 'user' && (
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
    dataCategories: ['email', 'name'] as string[],
    lawfulBasis: LegalBasis.CONSENT,
    expiresAt: ''
  })
  const [dataCategoriesInput, setDataCategoriesInput] = useState('email, name')

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
              Data Categories
            </label>
            <input
              type="text"
              value={dataCategoriesInput}
              onChange={(e) => {
                const value = e.target.value
                setDataCategoriesInput(value)
                setFormData({
                  ...formData,
                  dataCategories: value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
                })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="email, name, address"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated list of personal data fields requested.</p>
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

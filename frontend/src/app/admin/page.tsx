'use client'

import { useState, useEffect } from 'react'
import { 
  ShieldCheckIcon, 
  ChartBarIcon,
  DocumentTextIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import { api } from '@/lib/api'
import { ComplianceStatus } from '@consentire/shared'
import { createClient } from '@/lib/supabase'

export default function AdminPage() {
  const [controllerHash, setControllerHash] = useState<string>('')
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null)
  const [report, setReport] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      const session = data.session

      if (!session) {
        setSignedIn(false)
        setIsAdmin(false)
        return
      }

      const token = session.access_token
      if (token) {
        localStorage.setItem('token', token)
      }

      const role = (session.user.app_metadata?.role || session.user.user_metadata?.role || 'user') as string
      setSignedIn(true)
      setIsAdmin(role === 'admin')
    }

    init()
  }, [])

  const loadCompliance = async () => {
    if (!controllerHash) return
    
    setLoading(true)
    try {
      const [statusRes, reportRes] = await Promise.all([
        api.get(`/compliance/status/${controllerHash}`),
        api.get(`/compliance/report/${controllerHash}`)
      ])
      setCompliance(statusRes.data)
      setReport(reportRes.data)
    } catch (error) {
      console.error('Failed to load compliance status:', error)
      alert('Failed to load compliance status')
    } finally {
      setLoading(false)
    }
  }

  const supabaseSignIn = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({ provider: 'github' })
  }

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">ConsenTide Admin Console</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!signedIn && (
          <div className="bg-white rounded-lg shadow p-8 text-center mb-6">
            <p className="text-gray-700 mb-4">Sign in as an administrator to view compliance analytics.</p>
            <button onClick={supabaseSignIn} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition">Sign in</button>
          </div>
        )}

        {signedIn && !isAdmin && (
          <div className="bg-white rounded-lg shadow p-8 text-center mb-6">
            <p className="text-gray-700">You must be an administrator to access this console.</p>
          </div>
        )}

        {/* Compliance Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">GDPR Compliance Status</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              value={controllerHash}
              onChange={(e) => setControllerHash(e.target.value)}
              placeholder="Enter Controller Hash"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              onClick={loadCompliance}
              disabled={loading || !controllerHash || !isAdmin}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Check Compliance'}
            </button>
          </div>
        </div>

        {/* Compliance Dashboard */}
        {isAdmin && compliance && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Overall Compliance</h3>
                <span className={`text-3xl font-bold ${getComplianceColor(compliance.overallCompliance)}`}>
                  {compliance.overallCompliance}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
                    compliance.overallCompliance >= 90 ? 'bg-green-500' :
                    compliance.overallCompliance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${compliance.overallCompliance}%` }}
                />
              </div>
            </div>

            {/* GDPR Articles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ArticleCard
                article="Article 7"
                title="Conditions for Consent"
                compliant={compliance.gdprArticle7}
              />
              <ArticleCard
                article="Article 12"
                title="Transparent Information"
                compliant={compliance.gdprArticle12}
              />
              <ArticleCard
                article="Article 13"
                title="Information to be Provided"
                compliant={compliance.gdprArticle13}
              />
              <ArticleCard
                article="Article 17"
                title="Right to Erasure"
                compliant={compliance.gdprArticle17}
              />
              <ArticleCard
                article="Article 20"
                title="Data Portability"
                compliant={compliance.gdprArticle20}
              />
              <ArticleCard
                article="Article 25"
                title="Data Protection by Design"
                compliant={compliance.gdprArticle25}
              />
              <ArticleCard
                article="Article 30"
                title="Records of Processing"
                compliant={compliance.gdprArticle30}
              />
            </div>

            {/* Compliance Report */}
            {report && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Compliance Report</h3>
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `compliance-report-${compliance.controllerHash.substring(0, 8)}.json`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition"
                  >
                    Download Report
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Controller: {report.controller.organizationName} ({report.controller.organizationId})
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Summary</h4>
                    <p>Total Consents: {report.summary.totalConsents}</p>
                    <p>Active: {report.summary.activeConsents}</p>
                    <p>Revoked: {report.summary.revokedConsents}</p>
                    <p>Expired: {report.summary.expiredConsents}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Latest Activity</h4>
                    <p>Audit Entries: {report.auditTrail.length}</p>
                    <p>Recent Consents: {report.recentConsents.length}</p>
                    <p>Generated: {new Date(report.generatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {isAdmin && !compliance && !loading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Compliance Data</h3>
            <p className="text-gray-600">
              Enter a controller hash above to check GDPR compliance status.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

function ArticleCard({ article, title, compliant }: { article: string, title: string, compliant: boolean }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-600">{article}</span>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          compliant ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {compliant ? 'Compliant' : 'Non-Compliant'}
        </span>
      </div>
      <p className="text-sm text-gray-900">{title}</p>
    </div>
  )
}

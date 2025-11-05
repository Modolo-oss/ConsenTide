'use client'

import { useState, useEffect } from 'react'
import {
  ShieldCheckIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UsersIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { api } from '@/lib/api'

interface ComplianceStats {
  totalControllers: number
  activeConsents: number
  complianceScore: number
  lastUpdated: string
}

interface ControllerInfo {
  id: string
  name: string
  complianceScore: number
  totalConsents: number
  lastAudit: string
}

export default function CompliancePage() {
  const [stats, setStats] = useState<ComplianceStats | null>(null)
  const [controllers, setControllers] = useState<ControllerInfo[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadComplianceData()
  }, [])

  const loadComplianceData = async () => {
    try {
      // Mock data for demo - in production this would come from API
      setStats({
        totalControllers: 47,
        activeConsents: 12543,
        complianceScore: 87.3,
        lastUpdated: new Date().toISOString()
      })

      setControllers([
        {
          id: 'ctrl_001',
          name: 'TechCorp Solutions',
          complianceScore: 95,
          totalConsents: 2341,
          lastAudit: '2024-01-15'
        },
        {
          id: 'ctrl_002',
          name: 'DataFlow Inc',
          complianceScore: 89,
          totalConsents: 1876,
          lastAudit: '2024-01-14'
        },
        {
          id: 'ctrl_003',
          name: 'PrivacyFirst Ltd',
          complianceScore: 76,
          totalConsents: 543,
          lastAudit: '2024-01-13'
        }
      ])
    } catch (error) {
      console.error('Failed to load compliance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredControllers = controllers.filter(controller =>
    controller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    controller.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading compliance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <EyeIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">GDPR Compliance Monitor</h1>
                <p className="text-sm text-gray-600">Public transparency dashboard</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Last updated: {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Registered Controllers</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalControllers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Consents</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeConsents?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Compliance Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.complianceScore || 0}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Data Subjects Protected</p>
                <p className="text-2xl font-bold text-gray-900">10K+</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Score Overview */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Industry Compliance Overview</h2>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full"
                style={{ width: `${stats?.complianceScore || 0}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Overall Compliance: {stats?.complianceScore || 0}%</span>
              <span>Target: 95%</span>
            </div>
          </div>
        </div>

        {/* Controller Directory */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Controller Compliance Directory</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search controllers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  <span>Export Report</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Controller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compliance Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Consents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Audit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredControllers.map((controller) => (
                  <tr key={controller.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{controller.name}</div>
                        <div className="text-sm text-gray-500">{controller.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getComplianceColor(controller.complianceScore)}`}>
                        {controller.complianceScore}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {controller.totalConsents.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(controller.lastAudit).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        controller.complianceScore >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {controller.complianceScore >= 80 ? 'Compliant' : 'Under Review'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredControllers.length === 0 && (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No controllers found</h3>
              <p className="text-gray-600">Try adjusting your search terms</p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <ShieldCheckIcon className="h-6 w-6 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-2">About This Dashboard</h3>
              <p className="text-sm text-blue-700 mb-3">
                This public compliance dashboard provides transparency into GDPR compliance across registered data controllers.
                All data is updated in real-time and backed by immutable records on the Constellation Hypergraph.
              </p>
              <p className="text-xs text-blue-600">
                For detailed compliance reports or regulatory access, please register as an auditor.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
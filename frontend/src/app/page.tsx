'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  CheckCircleIcon, 
  ShieldCheckIcon, 
  LockClosedIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">ConsenTide</h1>
            </div>
            <nav className="flex space-x-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/admin" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                Admin
              </Link>
              <Link href="/api-docs" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                API Docs
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            GDPR Consent Dynamic Ledger
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Zero-knowledge GDPR consent management with immutable audit trails and dynamic revocation capabilities. 
            Built on Constellation's Hypergraph for true immutability.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/dashboard"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Get Started
            </Link>
            <Link 
              href="/api-docs"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold border-2 border-primary-600 hover:bg-primary-50 transition"
            >
              View API Docs
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={<ShieldCheckIcon className="h-12 w-12" />}
            title="Zero-Knowledge Proofs"
            description="Verify consent without exposing personal data. Complete privacy protection through cryptographic proofs."
          />
          <FeatureCard
            icon={<LockClosedIcon className="h-12 w-12" />}
            title="Immutable Audit Trail"
            description="Every consent action is hash-anchored to HGTP. Unbreakable audit trails for regulatory compliance."
          />
          <FeatureCard
            icon={<ChartBarIcon className="h-12 w-12" />}
            title="Real-time Compliance"
            description="Monitor GDPR Article 7 & 13 compliance status in real-time. Instant violation detection and alerts."
          />
          <FeatureCard
            icon={<DocumentTextIcon className="h-12 w-12" />}
            title="Dynamic Consent Lifecycle"
            description="Grant, monitor, and revoke data-processing permissions in real-time with instant API access control."
          />
          <FeatureCard
            icon={<CheckCircleIcon className="h-12 w-12" />}
            title="Cross-Platform Integration"
            description="RESTful API for any system. Easy integration with CRM, ERP, marketing tools, and more."
          />
          <FeatureCard
            icon={<UserGroupIcon className="h-12 w-12" />}
            title="Token-Governed Privacy"
            description="El Paca tokens enable community voting on privacy policies. Democratic governance of consent standards."
          />
        </div>

        {/* Architecture Diagram */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Architecture</h2>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <h3 className="font-semibold text-lg mb-2">Front-End UI</h3>
              <p className="text-gray-600">User Dashboard • Admin Console • API Gateway</p>
            </div>
            <div className="text-center text-gray-400">↓</div>
            <div className="bg-indigo-50 p-4 rounded-lg border-2 border-indigo-200">
              <h3 className="font-semibold text-lg mb-2">ConsenTide Metagraph</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Consent State Engine</li>
                <li>• ZKP Verification Service</li>
                <li>• El Paca Governance Module</li>
                <li>• Cross-Platform API Adapter</li>
              </ul>
            </div>
            <div className="text-center text-gray-400">↓</div>
            <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
              <h3 className="font-semibold text-lg mb-2">HGTP (Immutable Consent Ledger)</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Hash-chained consent records</li>
                <li>• Zero-knowledge proof anchoring</li>
                <li>• Cross-chain verification endpoints</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">© 2024 ConsenTide. Built for Constellation x LegalTech Hackathon.</p>
            <p className="text-gray-500 text-sm mt-2">MIT License • Open Source</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="text-primary-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

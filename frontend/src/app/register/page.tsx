'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeftIcon,
  UserIcon,
  BuildingOfficeIcon,
  ScaleIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { createClient } from '@/lib/supabase'

const stakeholderTypes = [
  {
    id: 'user',
    title: 'Individual User',
    subtitle: 'Manage my data privacy rights',
    description: 'Take control of your personal data. Grant, monitor, and revoke consent across all organizations.',
    icon: UserIcon,
    benefits: ['Personal data dashboard', 'Consent management', 'Privacy rights enforcement'],
    href: '/register/user'
  },
  {
    id: 'organization',
    title: 'Organization',
    subtitle: 'Register as data controller',
    description: 'Comply with GDPR while building trust. Manage consent requests and demonstrate compliance.',
    icon: BuildingOfficeIcon,
    benefits: ['Compliance automation', 'Audit trails', 'Integration APIs'],
    href: '/register/organization'
  },
  {
    id: 'regulator',
    title: 'Regulator/Auditor',
    subtitle: 'Monitor compliance',
    description: 'Access real-time compliance data, audit organizations, and ensure regulatory compliance.',
    icon: ScaleIcon,
    benefits: ['Compliance monitoring', 'Audit reports', 'Enforcement tools'],
    href: '/register/auditor'
  }
]

const quizQuestions = [
  {
    question: "What's your primary goal?",
    options: [
      { text: "Monitor GDPR compliance", value: "regulator", icon: ScaleIcon },
      { text: "Manage my personal data", value: "user", icon: UserIcon },
      { text: "Manage customer data for my business", value: "organization", icon: BuildingOfficeIcon }
    ]
  },
  {
    question: "What's your organization size?",
    options: [
      { text: "Individual/Solo", value: "user" },
      { text: "Small business (1-50 employees)", value: "organization" },
      { text: "Enterprise (50+ employees)", value: "organization" },
      { text: "Government/Regulatory body", value: "regulator" }
    ]
  },
  {
    question: "What's your technical comfort level?",
    options: [
      { text: "Beginner - I need simple tools", value: "user" },
      { text: "Intermediate - I can handle some setup", value: "organization" },
      { text: "Advanced - I need full API access", value: "organization" }
    ]
  }
]

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const stakeholderType = searchParams.get('type')
  const source = searchParams.get('source')

  const [showQuiz, setShowQuiz] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<string[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [recommendedStakeholder, setRecommendedStakeholder] = useState<string | null>(null)
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [registrationData, setRegistrationData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    organizationName: '',
    role: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)

  // Auto-show registration form if stakeholder type is specified
  useEffect(() => {
    if (stakeholderType && ['user', 'organization', 'regulator'].includes(stakeholderType)) {
      setShowRegistrationForm(true)
    }
  }, [stakeholderType])

  const handleQuizAnswer = (answer: string) => {
    const newAnswers = [...quizAnswers, answer]
    setQuizAnswers(newAnswers)

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Determine recommendation based on answers
      const regulatorCount = newAnswers.filter(a => a === 'regulator').length
      const organizationCount = newAnswers.filter(a => a === 'organization').length
      const userCount = newAnswers.filter(a => a === 'user').length

      if (regulatorCount >= 1) {
        setRecommendedStakeholder('regulator')
      } else if (organizationCount >= userCount) {
        setRecommendedStakeholder('organization')
      } else {
        setRecommendedStakeholder('user')
      }
    }
  }

  const resetQuiz = () => {
    setShowQuiz(false)
    setQuizAnswers([])
    setCurrentQuestion(0)
    setRecommendedStakeholder(null)
    setShowRegistrationForm(false)
  }

  const handleStakeholderSelect = (stakeholderId: string) => {
    setShowRegistrationForm(true)
    // Update URL without navigation
    const newUrl = `/register?type=${stakeholderId}&source=selection`
    window.history.replaceState({}, '', newUrl)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!registrationData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(registrationData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!registrationData.password) {
      newErrors.password = 'Password is required'
    } else if (registrationData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!registrationData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (registrationData.password !== registrationData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (stakeholderType === 'user' && !registrationData.fullName) {
      newErrors.fullName = 'Full name is required'
    }

    if (stakeholderType === 'organization' && !registrationData.organizationName) {
      newErrors.organizationName = 'Organization name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const supabase = createClient()

      // For demo purposes, skip email confirmation and auto-login
      const { data, error } = await supabase.auth.signUp({
        email: registrationData.email,
        password: registrationData.password,
        options: {
          data: {
            role: stakeholderType,
            full_name: registrationData.fullName,
            organization_name: registrationData.organizationName,
            source: source || 'direct'
          },
          // Skip email confirmation for demo
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) throw error

      // Auto-login immediately after registration (demo mode)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: registrationData.email,
        password: registrationData.password
      })

      if (signInError) throw signInError

      // Success - redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Registration error:', error)
      if (error.message.includes('already registered')) {
        setErrors({ general: 'This email is already registered. Please sign in instead.' })
      } else {
        setErrors({ general: error.message || 'Registration failed. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  // Show registration form for context-aware registration
  if (showRegistrationForm && stakeholderType) {
    const stakeholder = stakeholderTypes.find(s => s.id === stakeholderType)
    if (!stakeholder) return null

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <stakeholder.icon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Join as {stakeholder.title}</h2>
              <p className="text-gray-600 mt-2">{stakeholder.subtitle}</p>
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleRegistration} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address *
                </label>
                <div className="relative">
                  <EnvelopeIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={registrationData.email}
                    onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
              </div>

              {stakeholderType === 'user' && (
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={registrationData.fullName}
                    onChange={(e) => setRegistrationData({ ...registrationData, fullName: e.target.value })}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>}
                </div>
              )}

              {stakeholderType === 'organization' && (
                <div>
                  <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name *
                  </label>
                  <input
                    id="organizationName"
                    type="text"
                    required
                    value={registrationData.organizationName}
                    onChange={(e) => setRegistrationData({ ...registrationData, organizationName: e.target.value })}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your organization name"
                  />
                  {errors.organizationName && <p className="text-red-600 text-sm mt-1">{errors.organizationName}</p>}
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <KeyIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={registrationData.password}
                    onChange={(e) => setRegistrationData({ ...registrationData, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <KeyIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={registrationData.confirmPassword}
                    onChange={(e) => setRegistrationData({ ...registrationData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : `Join as ${stakeholder.title}`}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
                  Sign in
                </Link>
              </p>
            </div>

            <button
              onClick={() => {
                setShowRegistrationForm(false)
                window.history.replaceState({}, '', '/register')
              }}
              className="w-full mt-4 text-gray-600 hover:text-gray-800 text-sm"
            >
              ← Back to selection
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showQuiz && !recommendedStakeholder) {
    const question = quizQuestions[currentQuestion]
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <QuestionMarkCircleIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Find Your Path</h2>
              <p className="text-gray-600 mt-2">Answer a few questions to get personalized recommendations</p>
            </div>

            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-500 mb-4">
                <span>Question {currentQuestion + 1} of {quizQuestions.length}</span>
                <span>{Math.round(((currentQuestion + 1) / quizQuestions.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{question.question}</h3>
              <div className="space-y-3">
                {question.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuizAnswer(option.value)}
                    className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center">
                      {'icon' in option && option.icon && <option.icon className="h-5 w-5 text-blue-600 mr-3" />}
                      <span className="text-gray-900">{option.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={resetQuiz}
              className="w-full text-gray-600 hover:text-gray-800 text-sm"
            >
              ← Back to stakeholder selection
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (recommendedStakeholder) {
    const stakeholder = stakeholderTypes.find(s => s.id === recommendedStakeholder)!
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Perfect Match!</h2>
              <p className="text-gray-600 mt-2">Based on your answers, we recommend:</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-center mb-4">
                <stakeholder.icon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{stakeholder.title}</h3>
                  <p className="text-sm text-blue-600">{stakeholder.subtitle}</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">{stakeholder.description}</p>
              <ul className="space-y-2">
                {stakeholder.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-600">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <Link
                href={stakeholder.href}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                Continue as {stakeholder.title}
              </Link>
              <button
                onClick={resetQuiz}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Retake Quiz
              </button>
            </div>
          </div>
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
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to home
            </Link>
            <div className="text-sm text-gray-600">
              Already have an account? <Link href="/login" className="text-blue-600 hover:text-blue-800">Sign in</Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Join ConsenTide</h1>
          <p className="text-lg text-gray-600 mb-8">
            Choose how you'll use our platform to get started with the right experience
          </p>

          <div className="inline-flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <QuestionMarkCircleIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-blue-700">Not sure which option is right for you?</span>
            <button
              onClick={() => setShowQuiz(true)}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Take our quiz →
            </button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {stakeholderTypes.map((stakeholder) => (
            <div
              key={stakeholder.id}
              className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow"
            >
              <div className="text-center mb-6">
                <stakeholder.icon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900">{stakeholder.title}</h3>
                <p className="text-blue-600 font-medium">{stakeholder.subtitle}</p>
              </div>

              <p className="text-gray-600 mb-6">{stakeholder.description}</p>

              <ul className="space-y-3 mb-8">
                {stakeholder.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-600">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-3" />
                    {benefit}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleStakeholderSelect(stakeholder.id)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                Get Started
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            By registering, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-800">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
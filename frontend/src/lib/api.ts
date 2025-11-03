/**
 * API client for ConsenTide backend
 */

import axios from 'axios'
import { APIError } from '@consentire/shared'
import { createClient } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(async (config) => {
  try {
    // Prefer Supabase session token
    if (typeof window !== 'undefined') {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token || window.localStorage.getItem('token')
      if (token) {
        config.headers = config.headers || {}
        ;(config.headers as any).Authorization = `Bearer ${token}`
      }
    }
  } catch {}
  return config
})

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data) {
      const apiError: APIError = error.response.data
      console.error('API Error:', apiError)
    }
    return Promise.reject(error)
  }
)

export default api

import axios from 'axios'

/*const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})*/
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api` || '/api',
})

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
}

export const roadmapAPI = {
  list:           ()          => api.get('/roadmaps'),
  get:            (id)        => api.get(`/roadmaps/${id}`),
  getShared:      (token)     => api.get(`/roadmaps/shared/${token}`),
  create:         (data)      => api.post('/roadmaps', data),
  rename:         (id, title) => api.patch(`/roadmaps/${id}`, { title }),
  delete:         (id)        => api.delete(`/roadmaps/${id}`),
  toggleShare:    (id)        => api.post(`/roadmaps/${id}/share`),
  saveProgress:   (id, data)  => api.post(`/roadmaps/${id}/progress`, data),
}

export const aiAPI = {
  generate: (technology) => api.post('/ai/generate', { technology }),
}

export const quizAPI = {
  generate:   (data)        => api.post('/quiz/generate', data),
  saveResult: (data)        => api.post('/quiz/result', data),
  getResults: (roadmapId)   => api.get(`/quiz/results/${roadmapId}`),
  analytics:  (roadmapId)   => api.get('/quiz/analytics', { params: roadmapId ? { roadmap_id: roadmapId } : {} }),
}

export const resourcesAPI = {
  generate: (data) => api.post('/quiz/generate-resources', data), // { step, technology }
}

export default api
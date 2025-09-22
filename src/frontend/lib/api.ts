const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ApiResponse<T = any> {
  success?: boolean;
  message: string;
  data?: T;
  error?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for authentication
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'An error occurred',
          error: data.message,
        };
      }

      return {
        success: true,
        message: data.message || 'Success',
        data: data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        message: 'Network error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Authentication methods
  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    publicKey: string;
  }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async loginChallenge(email: string) {
    return this.request<{ nonce: string; email: string; message: string }>('/api/auth/login/challenge', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async loginVerify(email: string, signature: string, biometricScore?: number) {
    const response = await fetch(`${this.baseURL}/api/auth/login/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, signature, biometricScore }),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Login failed',
        error: data.message,
      };
    }

    // Store token in localStorage if present in response
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }

    return {
      success: true,
      message: data.message || 'Login successful',
      data: data,
    };
  }

  async loginWithPassword(email: string, password: string) {
    const response = await fetch(`${this.baseURL}/api/auth/login/password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Login failed',
        error: data.message,
      };
    }

    // Store token in localStorage if present in response
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }

    return {
      success: true,
      message: data.message || 'Login successful',
      data: data,
    };
  }

  async refreshToken() {
    const response = await this.request('/api/auth/refresh', {
      method: 'POST',
    });

    // Store new token in localStorage if present in response
    if (response.success && response.data && typeof response.data === 'object' && 'token' in response.data) {
      localStorage.setItem('authToken', (response.data as any).token);
    }

    return response;
  }

  async logout() {
    const response = await this.request('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });

    // Clear token from localStorage on successful logout
    if (response.success) {
      localStorage.removeItem('authToken');
    }

    return response;
  }

  private getTokenFromCookie(): string | null {
    if (typeof window === 'undefined') return null;

    // Check localStorage first
    const localStorageToken = localStorage.getItem('authToken');
    if (localStorageToken) {
      return localStorageToken;
    }

    // Fallback to cookies for backward compatibility
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'authToken') {
        return value;
      }
    }
    return null;
  }

  // Utility method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getTokenFromCookie();
  }

  // Verify if the current token is valid by making a test API call
  async verifyAuthentication(): Promise<boolean> {
    try {
      console.log('Verifying authentication...');

      const token = this.getTokenFromCookie();
      console.log('Token from storage:', token ? 'Found' : 'Not found');

      if (!token) {
        console.log('No auth token found');
        return false;
      }

      const response = await this.getProfile();
      console.log('Profile response:', response);

      return response.success === true && !!response.data?.user;
    } catch (error) {
      console.error('Authentication verification failed:', error);
      return false;
    }
  }

  // Get user profile
  async getProfile() {
    return this.request<{
      user: {
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        role: string;
      };
    }>('/api/protected/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }

  // Patient endpoints
  async getPatients() {
    return this.request('/api/protected/patients', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }

  async getPatient(id: string) {
    return this.request(`/api/protected/patients/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }

  async createPatient(patientData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    medicalHistory: string;
  }) {
    return this.request('/api/protected/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }

  async updatePatient(id: string, patientData: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    medicalHistory: string;
  }>) {
    return this.request(`/api/protected/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }

  async deletePatient(id: string) {
    return this.request(`/api/protected/patients/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }

  // Appointment endpoints
  async getAppointments() {
    return this.request('/api/protected/appointments', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }

  async getAppointment(id: string) {
    return this.request(`/api/protected/appointments/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }

  async createAppointment(appointmentData: {
    patientId: string;
    date: string;
    time: string;
    type: string;
    duration: number;
    notes?: string;
  }) {
    return this.request('/api/protected/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }

  async updateAppointment(id: string, appointmentData: Partial<{
    patientId: string;
    date: string;
    time: string;
    type: string;
    duration: number;
    notes: string;
  }>) {
    return this.request(`/api/protected/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }

  async updateAppointmentStatus(id: string, status: string) {
    return this.request(`/api/protected/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }

  async deleteAppointment(id: string) {
    return this.request(`/api/protected/appointments/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }

  // Message endpoints
  async getMessages() {
    return this.request('/api/protected/messages', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }

  async getSentMessages() {
    return this.request('/api/protected/messages/sent', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }

  async getMessage(id: string) {
    return this.request(`/api/protected/messages/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }

  async sendMessage(messageData: {
    subject: string;
    message: string;
    recipient: string;
  }) {
    return this.request('/api/protected/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }

  async markMessageRead(id: string) {
    return this.request(`/api/protected/messages/${id}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }

  async archiveMessage(id: string) {
    return this.request(`/api/protected/messages/${id}/archive`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }

  async deleteMessage(id: string) {
    return this.request(`/api/protected/messages/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }

  // Sessions endpoint
  async getSessions() {
    return this.request('/api/protected/sessions', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getTokenFromCookie()}`,
      },
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;

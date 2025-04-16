import apiService from './apiService';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

class AuthService {
  private tokenKey = 'auth_token';

  // Check if the token exists
  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      return Boolean(localStorage.getItem(this.tokenKey));
    }
    return false;
  }

  // Store auth token
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  // Get auth token
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  // User login
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    this.setToken(response.access_token);
    return response;
  }

  // User registration
  async register(credentials: AuthCredentials): Promise<any> {
    return apiService.post('/auth/register', credentials);
  }

  // Logout user
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
    }
  }

  // Get user profile
  async getUserProfile(): Promise<User> {
    return apiService.get<User>('/auth/profile');
  }

  // Update user profile
  async updateProfile(userData: Partial<AuthCredentials>): Promise<User> {
    return apiService.patch<User>('/users/profile', userData);
  }
}

export default new AuthService(); 
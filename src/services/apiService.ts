const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiService {
  private async request<T>(
    url: string, 
    method: string, 
    data?: any
  ): Promise<T> {
    const token = localStorage.getItem('auth_token');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_URL}${url}`, options);
    
    // Check if the response was successful
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    // Only try to parse JSON if there's content
    if (response.status !== 204) {
      return response.json();
    }
    
    return {} as T;
  }
  
  public get<T>(url: string): Promise<T> {
    return this.request<T>(url, 'GET');
  }
  
  public post<T>(url: string, data: any): Promise<T> {
    return this.request<T>(url, 'POST', data);
  }
  
  public put<T>(url: string, data: any): Promise<T> {
    return this.request<T>(url, 'PUT', data);
  }
  
  public patch<T>(url: string, data: any): Promise<T> {
    return this.request<T>(url, 'PATCH', data);
  }
  
  public delete<T>(url: string): Promise<T> {
    return this.request<T>(url, 'DELETE');
  }
}

export default new ApiService(); 
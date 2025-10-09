import type { User, PermissionsResponse, CreateUserRequest, UpdateUserRequest } from '../types';

class ApiClient {
  private baseUrl = '/api';

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Auth
  async checkAuth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/permissions`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async logout(): Promise<void> {
    window.location.href = `${this.baseUrl}/logout`;
  }

  // Permissions
  async getPermissions(): Promise<PermissionsResponse> {
    return this.request<PermissionsResponse>('/permissions');
  }

  // Users
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async getUser(id: number): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: UpdateUserRequest): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: number): Promise<void> {
    await fetch(`${this.baseUrl}/users/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();

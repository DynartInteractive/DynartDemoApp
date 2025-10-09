import type { User, PermissionsResponse, CreateUserRequest, UpdateUserRequest } from '../types';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

class ApiClient {
  private baseUrl = '/api';
  private token: string | null = null;

  constructor() {
    this.loadToken();
  }

  private async loadToken() {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: 'auth_token' });
      this.token = value;
    }
  }

  private async saveToken(token: string) {
    this.token = token;
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: 'auth_token', value: token });
    }
  }

  private async clearToken() {
    this.token = null;
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: 'auth_token' });
    }
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add token for mobile, cookies handled automatically for web
    if (Capacitor.isNativePlatform() && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers = await this.getHeaders();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.clearToken();
        throw new Error('Unauthorized');
      }
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Auth
  async loginWithGoogle(idToken: string): Promise<{ token: string; user: any }> {
    const result = await this.request<{ token: string; user: any }>('/mobile-auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    await this.saveToken(result.token);
    return result;
  }

  async checkAuth(): Promise<boolean> {
    try {
      await this.loadToken();
      const response = await fetch(`${this.baseUrl}/permissions`, {
        headers: await this.getHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async logout(): Promise<void> {
    await this.clearToken();
    if (!Capacitor.isNativePlatform()) {
      window.location.href = `${this.baseUrl}/logout`;
    }
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

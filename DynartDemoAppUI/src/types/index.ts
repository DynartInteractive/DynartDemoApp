export interface User {
  id: number;
  displayName: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Permission {
  name: string;
}

export interface PermissionsResponse {
  permissions: string[];
}

export interface CreateUserRequest {
  displayName: string;
  email: string;
  role: string;
}

export interface UpdateUserRequest {
  displayName: string;
  email: string;
  role: string;
}

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
  name: string;
  email: string;
  role: string;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  role: string;
}

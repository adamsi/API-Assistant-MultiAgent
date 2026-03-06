export interface User {
  username: string;
  picture?: string;
  role: string;
}

export interface LoginUserDto {
  username: string;
  password: string;
}

export interface RegisterUserDto {
  username: string;
  password: string;
}


export interface AuthResponse {
  message: string;
  user?: User;
} 
"use client";
// "use client": 이 파일은 브라우저에서 실행되는 컴포넌트라는 표시.
// useState/useContext 같은 훅은 서버 컴포넌트에서 못 쓰기 때문에 필수로 붙여야 함

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { login as loginApi, type AuthResponse } from "@/lib/api";

// 로그인한 사용자 정보를 담을 타입.
// 로그인/회원가입 응답(AuthResponse)에 firstName이 추가돼서 같이 저장
type AuthUser = { email: string; firstName: string };

// Context에 담길 값들의 타입 정의
type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
};

// createContext(null): 아직 아무 값도 없는 빈 상자를 만듦.
// 실제 값은 AuthProvider가 렌더링될 때 채워짐
const AuthContext = createContext<AuthContextValue | null>(null);

// 이 컴포넌트로 감싼 영역 안에서는 어디서든 useAuth()로 로그인 상태를 꺼내 쓸 수 있게 됨
export function AuthProvider({ children }: { children: ReactNode }) {
  // user와 isLoading을 따로따로 두면, 이펙트 안에서 setState를 두 번 호출하게 되어
  // 리렌더링이 겹쳐 발생할 수 있음(React가 경고하는 부분). 하나의 상태로 합쳐서
  // 한 번의 setState로 끝내도록 함
  const [state, setState] = useState<{ user: AuthUser | null; isLoading: boolean }>({
    user: null,
    isLoading: true,
  });

  // 페이지가 처음 열렸을 때, 예전에 로그인해서 저장해둔 토큰이 있는지 확인.
  // 있으면 "로그인된 상태"로 간주 (토큰이 진짜 유효한지는 5단계에서 보완할 예정)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    const firstName = localStorage.getItem("firstName");
    setState({
      user: token && email && firstName ? { email, firstName } : null,
      isLoading: false,
    });
  }, []); // 빈 배열 = 컴포넌트가 처음 나타날 때 딱 한 번만 실행

  const { user, isLoading } = state;

  async function login(email: string, password: string) {
    const res = await loginApi({ email, password });
    // 토큰/이메일/이름을 브라우저에 저장 (새로고침해도 로그인 상태 유지되게)
    localStorage.setItem("token", res.token);
    localStorage.setItem("email", res.email);
    localStorage.setItem("firstName", res.firstName);
    setState({ user: { email: res.email, firstName: res.firstName }, isLoading: false });
    return res;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("firstName");
    setState({ user: null, isLoading: false });
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 다른 컴포넌트들이 이 훅 하나로 로그인 상태에 접근하게 해주는 통로
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있습니다.");
  return ctx;
}
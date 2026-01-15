"use client";

import { useState, CSSProperties } from "react";
import { useLogin } from "@refinedev/core";
import Link from "next/link";
import { Github } from "lucide-react";
import { CORE } from "@/configs/core";

interface LoginFormValues {
    username: string;
    password: string;
}

// Notion-style inline styles for guaranteed rendering
const styles: Record<string, CSSProperties> = {
    page: {
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        fontFamily: "Montserrat, system-ui, sans-serif",
    },
    container: {
        width: "100%",
        maxWidth: "400px",
        padding: "2rem 0",
    },
    logoWrapper: {
        textAlign: "center" as const,
        marginBottom: "2rem",
    },
    logo: {
        width: "48px",
        height: "48px",
        margin: "0 auto",
        backgroundColor: "#1f2937",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    logoText: {
        color: "#ffffff",
        fontSize: "1.25rem",
        fontWeight: 700,
    },
    title: {
        fontSize: "1.5rem",
        fontWeight: 600,
        color: "#111827",
        textAlign: "center" as const,
        marginBottom: "0.5rem",
    },
    subtitle: {
        fontSize: "0.875rem",
        color: "#6b7280",
        textAlign: "center" as const,
        marginBottom: "2rem",
    },
    socialBtn: {
        width: "100%",
        height: "44px",
        backgroundColor: "#ffffff",
        color: "#374151",
        fontSize: "0.875rem",
        fontWeight: 500,
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        cursor: "pointer",
        transition: "all 0.15s ease",
    },
    divider: {
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        margin: "1.5rem 0",
    },
    dividerLine: {
        flex: 1,
        height: "1px",
        backgroundColor: "#e5e7eb",
    },
    dividerText: {
        fontSize: "0.75rem",
        color: "#9ca3af",
        textTransform: "uppercase" as const,
        letterSpacing: "0.05em",
    },
    form: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "1rem",
    },
    input: {
        width: "100%",
        height: "44px",
        padding: "0 1rem",
        fontSize: "0.875rem",
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        outline: "none",
        transition: "border-color 0.15s ease",
        boxSizing: "border-box" as const,
    },
    inputError: {
        borderColor: "#f87171",
    },
    errorText: {
        marginTop: "0.375rem",
        fontSize: "0.75rem",
        color: "#ef4444",
    },
    linkRow: {
        display: "flex",
        justifyContent: "flex-end",
    },
    link: {
        fontSize: "0.875rem",
        color: "#6b7280",
        textDecoration: "none",
        transition: "color 0.15s ease",
    },
    submitBtn: {
        width: "100%",
        height: "44px",
        backgroundColor: "#1f2937",
        color: "#ffffff",
        fontSize: "0.875rem",
        fontWeight: 500,
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        transition: "background-color 0.15s ease",
    },
    submitBtnDisabled: {
        backgroundColor: "#d1d5db",
        cursor: "not-allowed",
    },
    footer: {
        textAlign: "center" as const,
        marginTop: "2rem",
        fontSize: "0.875rem",
        color: "#6b7280",
    },
    footerLink: {
        color: "#2563eb",
        fontWeight: 500,
        textDecoration: "none",
        marginLeft: "0.25rem",
    },
};

export function LoginPage() {
    const { mutate: login, isPending } = useLogin<LoginFormValues>();
    const [formData, setFormData] = useState<LoginFormValues>({
        username: "",
        password: "",
    });
    const [errors, setErrors] = useState<Partial<LoginFormValues>>({});

    const validate = (): boolean => {
        const newErrors: Partial<LoginFormValues> = {};

        if (!formData.username.trim()) {
            newErrors.username = "Vui lòng nhập email hoặc tên đăng nhập";
        }

        if (!formData.password) {
            newErrors.password = "Vui lòng nhập mật khẩu";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        login({
            username: formData.username,
            password: formData.password,
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof LoginFormValues]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleGithubLogin = () => {
        const apiUrl = CORE.API_URL || "";
        window.location.href = `${apiUrl}/auth/github`;
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Logo */}
                <div style={styles.logoWrapper}>
                    <div style={styles.logo}>
                        <span style={styles.logoText}>D</span>
                    </div>
                </div>

                {/* Title */}
                <h1 style={styles.title}>Đăng nhập</h1>
                <p style={styles.subtitle}>Chào mừng bạn quay trở lại</p>

                {/* GitHub Login */}
                <button
                    type="button"
                    onClick={handleGithubLogin}
                    style={styles.socialBtn}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "#f9fafb";
                        e.currentTarget.style.borderColor = "#d1d5db";
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "#ffffff";
                        e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                >
                    <Github size={18} />
                    <span>Tiếp tục với GitHub</span>
                </button>

                {/* Divider */}
                <div style={styles.divider}>
                    <div style={styles.dividerLine} />
                    <span style={styles.dividerText}>hoặc</span>
                    <div style={styles.dividerLine} />
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Email hoặc tên đăng nhập"
                            style={{
                                ...styles.input,
                                ...(errors.username ? styles.inputError : {}),
                            }}
                            autoComplete="username"
                        />
                        {errors.username && (
                            <p style={styles.errorText}>{errors.username}</p>
                        )}
                    </div>

                    <div>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Mật khẩu"
                            style={{
                                ...styles.input,
                                ...(errors.password ? styles.inputError : {}),
                            }}
                            autoComplete="current-password"
                        />
                        {errors.password && (
                            <p style={styles.errorText}>{errors.password}</p>
                        )}
                    </div>

                    {/* Forgot Password Link */}
                    <div style={styles.linkRow}>
                        <Link href="/forgot-password" style={styles.link}>
                            Quên mật khẩu?
                        </Link>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isPending}
                        style={{
                            ...styles.submitBtn,
                            ...(isPending ? styles.submitBtnDisabled : {}),
                        }}
                        onMouseOver={(e) => {
                            if (!isPending) e.currentTarget.style.backgroundColor = "#111827";
                        }}
                        onMouseOut={(e) => {
                            if (!isPending) e.currentTarget.style.backgroundColor = "#1f2937";
                        }}
                    >
                        {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
                    </button>
                </form>

                {/* Footer */}
                <div style={styles.footer}>
                    <span>Chưa có tài khoản?</span>
                    <Link href="/register" style={styles.footerLink}>
                        Đăng ký ngay
                    </Link>
                </div>
            </div>
        </div>
    );
}

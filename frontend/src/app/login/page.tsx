"use client";

import { Suspense } from "react";
import { Authenticated } from "@refinedev/core";
import { LoginPage } from "@/features/auth";

export default function LoginRoute() {
    return (
        <Suspense>
            <Authenticated key="login-page" fallback={<LoginPage />}>
                {/* If already authenticated, redirect to home */}
                <meta httpEquiv="refresh" content="0;url=/" />
            </Authenticated>
        </Suspense>
    );
}

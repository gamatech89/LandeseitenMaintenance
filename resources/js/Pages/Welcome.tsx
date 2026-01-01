import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { Button, Card } from "antd";
import {
    SafetyOutlined,
    SyncOutlined,
    CloudServerOutlined,
} from "@ant-design/icons";

export default function Welcome({ auth }: PageProps) {
    return (
        <>
            <Head title="Willkommen | LSM Dashboard" />
            <div
                className="min-h-screen flex flex-col"
                style={{
                    background:
                        "linear-gradient(135deg, #6c1e9f 0%, #4a1470 50%, #2d0a4e 100%)",
                }}
            >
                {/* Decorative Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                        className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10"
                        style={{ backgroundColor: "#fff" }}
                    />
                    <div
                        className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
                        style={{ backgroundColor: "#fff" }}
                    />
                </div>

                {/* Main Content */}
                <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
                    <div className="w-full max-w-lg">
                        {/* Logo Header */}
                        <div className="text-center mb-8">
                            <div
                                className="mx-auto w-24 h-24 rounded-2xl flex items-center justify-center mb-4 shadow-2xl"
                                style={{
                                    backgroundColor: "rgba(255,255,255,0.15)",
                                    backdropFilter: "blur(10px)",
                                }}
                            >
                                <img
                                    src="/images/logo.png"
                                    alt="LSM Logo"
                                    className="w-16 h-16 object-contain"
                                />
                            </div>
                            <h2 className="text-white text-2xl font-bold tracking-wide">
                                LSM
                            </h2>
                            <p className="text-white/60 text-sm mt-1">
                                Landeseiten Maintenance
                            </p>
                        </div>

                        {/* Main Card */}
                        <Card
                            className="text-center border-0"
                            style={{
                                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
                                borderRadius: "20px",
                                overflow: "hidden",
                            }}
                            bodyStyle={{ padding: "40px 32px" }}
                        >
                            {/* Hero Section */}
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                                Willkommen beim Dashboard
                            </h1>
                            <p className="text-gray-500 mb-8 text-base">
                                Zentrale Wartung und Sicherheit für Ihre
                                WordPress-Projekte.
                            </p>

                            {/* Feature Icons */}
                            <div className="flex justify-center gap-8 mb-8">
                                <div className="text-center">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
                                        style={{ backgroundColor: "#f3e8ff" }}
                                    >
                                        <SafetyOutlined
                                            style={{
                                                fontSize: "24px",
                                                color: "#6c1e9f",
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        Sicherheit
                                    </span>
                                </div>
                                <div className="text-center">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
                                        style={{ backgroundColor: "#f3e8ff" }}
                                    >
                                        <SyncOutlined
                                            style={{
                                                fontSize: "24px",
                                                color: "#6c1e9f",
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        Updates
                                    </span>
                                </div>
                                <div className="text-center">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
                                        style={{ backgroundColor: "#f3e8ff" }}
                                    >
                                        <CloudServerOutlined
                                            style={{
                                                fontSize: "24px",
                                                color: "#6c1e9f",
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        Hosting
                                    </span>
                                </div>
                            </div>

                            {/* CTA Button */}
                            {auth.user ? (
                                <Link href={route("dashboard")}>
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        style={{
                                            backgroundColor: "#6c1e9f",
                                            borderColor: "#6c1e9f",
                                            height: "52px",
                                            fontSize: "16px",
                                            fontWeight: 600,
                                            borderRadius: "12px",
                                        }}
                                    >
                                        Zum Dashboard gehen →
                                    </Button>
                                </Link>
                            ) : (
                                <Link href={route("login")}>
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        style={{
                                            backgroundColor: "#6c1e9f",
                                            borderColor: "#6c1e9f",
                                            height: "52px",
                                            fontSize: "16px",
                                            fontWeight: 600,
                                            borderRadius: "12px",
                                        }}
                                    >
                                        Jetzt anmelden →
                                    </Button>
                                </Link>
                            )}
                        </Card>
                    </div>
                </main>

                {/* Footer */}
                <footer className="py-6 text-center relative z-10">
                    <p className="text-white/60 text-sm">
                        © 2025 Landeseiten.de | Managed WordPress Maintenance
                    </p>
                </footer>
            </div>
        </>
    );
}

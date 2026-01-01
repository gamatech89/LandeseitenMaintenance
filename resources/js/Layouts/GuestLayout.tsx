import { Link } from "@inertiajs/react";
import { PropsWithChildren } from "react";

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div
            className="flex min-h-screen flex-col items-center pt-6 sm:justify-center sm:pt-0"
            style={{
                background: "linear-gradient(135deg, #6c1e9f 0%, #4a1470 100%)",
            }}
        >
            {/* Logo */}
            <div>
                <Link href="/" className="flex flex-col items-center">
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mb-2"
                        style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                    >
                        <img
                            src="/images/logo.png"
                            alt="LSM Logo"
                            className="w-14 h-14 object-contain"
                        />
                    </div>
                    <span className="text-white font-bold text-xl">LSM</span>
                </Link>
            </div>

            <div
                className="mt-6 w-full overflow-hidden bg-white px-6 py-8 shadow-xl sm:max-w-md sm:rounded-xl"
                style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}
            >
                {children}
            </div>

            {/* Footer */}
            <p className="mt-8 text-white/70 text-sm">
                © 2025 Landeseiten.de | Managed WordPress Maintenance
            </p>
        </div>
    );
}

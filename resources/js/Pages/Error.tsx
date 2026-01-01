import { Head, Link } from "@inertiajs/react";
import { Button, Result } from "antd";

interface ErrorPageProps {
    status: number;
}

export default function Error({ status }: ErrorPageProps) {
    const title: Record<number, string> = {
        503: "503: Service Unavailable",
        500: "500: Server Error",
        404: "404: Page Not Found",
        403: "403: Forbidden",
    };

    const description: Record<number, string> = {
        503: "Sorry, we are doing some maintenance. Please check back soon.",
        500: "Whoops, something went wrong on our servers.",
        404: "Sorry, the page you are looking for could not be found.",
        403: "Sorry, you are forbidden from accessing this page.",
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            }}
        >
            <Head title={title[status] || "Error"} />

            <Result
                status={status === 404 ? "404" : status === 403 ? "403" : "500"}
                title={
                    <span style={{ color: "#fff" }}>
                        {title[status] || "Error"}
                    </span>
                }
                subTitle={
                    <span style={{ color: "#999" }}>
                        {description[status] || "An unexpected error occurred."}
                    </span>
                }
                extra={
                    <Link href="/">
                        <Button
                            type="primary"
                            style={{
                                background: "#6c1e9f",
                                borderColor: "#6c1e9f",
                            }}
                        >
                            Back Home
                        </Button>
                    </Link>
                }
            />
        </div>
    );
}

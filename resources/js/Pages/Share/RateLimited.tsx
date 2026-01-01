import { Card, Typography, Result } from "antd";
import { HourglassOutlined } from "@ant-design/icons";
import { Head } from "@inertiajs/react";

const { Text } = Typography;

interface RateLimitedProps {
    retryAfter: number;
}

export default function RateLimited({ retryAfter }: RateLimitedProps) {
    return (
        <>
            <Head title="Too Many Requests" />
            <div
                style={{
                    minHeight: "100vh",
                    background:
                        "linear-gradient(135deg, #6c1e9f 0%, #4a1470 100%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px",
                }}
            >
                {/* Logo Header */}
                <div style={{ marginBottom: 24, textAlign: "center" }}>
                    <div
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 8px",
                        }}
                    >
                        <img
                            src="/images/logo.png"
                            alt="LSM Logo"
                            style={{
                                width: 40,
                                height: 40,
                                objectFit: "contain",
                            }}
                        />
                    </div>
                    <span
                        style={{
                            color: "white",
                            fontWeight: "bold",
                            fontSize: 18,
                        }}
                    >
                        LSM
                    </span>
                </div>

                <Card
                    style={{
                        maxWidth: 400,
                        width: "100%",
                        borderRadius: 16,
                        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                    }}
                >
                    <Result
                        icon={
                            <HourglassOutlined style={{ color: "#6c1e9f" }} />
                        }
                        title="Too Many Requests"
                        subTitle={
                            <Text type="secondary">
                                You've made too many requests. Please wait{" "}
                                {retryAfter} seconds before trying again.
                            </Text>
                        }
                    />
                </Card>
            </div>
        </>
    );
}

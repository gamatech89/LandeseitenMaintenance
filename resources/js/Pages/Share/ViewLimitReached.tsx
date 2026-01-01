import { Card, Typography, Result } from "antd";
import { EyeInvisibleOutlined } from "@ant-design/icons";
import { Head } from "@inertiajs/react";

const { Text } = Typography;

interface ViewLimitReachedProps {
    maxViews: number;
}

export default function ViewLimitReached({ maxViews }: ViewLimitReachedProps) {
    return (
        <>
            <Head title="View Limit Reached" />
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
                            <EyeInvisibleOutlined
                                style={{ color: "#6c1e9f" }}
                            />
                        }
                        title="View Limit Reached"
                        subTitle={
                            <Text type="secondary">
                                This credential share link has reached its
                                maximum view limit of {maxViews} view
                                {maxViews > 1 ? "s" : ""}. Please contact the
                                sender to request a new link if needed.
                            </Text>
                        }
                    />
                </Card>
            </div>
        </>
    );
}

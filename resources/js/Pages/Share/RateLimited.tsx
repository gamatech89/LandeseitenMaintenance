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
                        "linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px",
                }}
            >
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
                            <HourglassOutlined style={{ color: "#9b59b6" }} />
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

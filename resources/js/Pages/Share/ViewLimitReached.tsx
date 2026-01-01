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
                        "linear-gradient(135deg, #f39c12 0%, #e74c3c 100%)",
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
                            <EyeInvisibleOutlined
                                style={{ color: "#f39c12" }}
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

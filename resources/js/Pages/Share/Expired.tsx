import { Card, Typography, Result } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { Head } from "@inertiajs/react";

const { Text } = Typography;

interface ExpiredProps {
    expiredAt: string;
}

export default function Expired({ expiredAt }: ExpiredProps) {
    return (
        <>
            <Head title="Link Expired" />
            <div
                style={{
                    minHeight: "100vh",
                    background:
                        "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
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
                            <ClockCircleOutlined style={{ color: "#ff6b6b" }} />
                        }
                        title="This Link Has Expired"
                        subTitle={
                            <Text type="secondary">
                                This credential share link expired on{" "}
                                {expiredAt}. Please contact the sender to
                                request a new link.
                            </Text>
                        }
                    />
                </Card>
            </div>
        </>
    );
}

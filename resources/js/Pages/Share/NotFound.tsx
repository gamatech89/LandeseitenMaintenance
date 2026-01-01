import { Card, Typography, Result } from "antd";
import { FileUnknownOutlined } from "@ant-design/icons";
import { Head } from "@inertiajs/react";

const { Text } = Typography;

export default function NotFound() {
    return (
        <>
            <Head title="Link Not Found" />
            <div
                style={{
                    minHeight: "100vh",
                    background:
                        "linear-gradient(135deg, #636e72 0%, #2d3436 100%)",
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
                            <FileUnknownOutlined style={{ color: "#636e72" }} />
                        }
                        title="Link Not Found"
                        subTitle={
                            <Text type="secondary">
                                This credential share link doesn't exist or has
                                been revoked. Please check the URL or contact
                                the sender for a valid link.
                            </Text>
                        }
                    />
                </Card>
            </div>
        </>
    );
}

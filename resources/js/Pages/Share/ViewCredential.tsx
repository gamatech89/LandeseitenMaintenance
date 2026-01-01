import {
    Card,
    Typography,
    Button,
    Space,
    Alert,
    Descriptions,
    message,
} from "antd";
import {
    LockOutlined,
    UserOutlined,
    LinkOutlined,
    CopyOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    ClockCircleOutlined,
    SafetyOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { Head } from "@inertiajs/react";

const { Title, Text, Paragraph } = Typography;

interface CredentialData {
    title: string;
    type: string;
    project_name?: string;
    username?: string;
    password?: string;
    url?: string;
}

interface ViewCredentialProps {
    credential: CredentialData;
    note?: string;
    expiresAt: string;
    viewsRemaining: number;
    sharedBy: string;
}

export default function ViewCredential({
    credential,
    note,
    expiresAt,
    viewsRemaining,
    sharedBy,
}: ViewCredentialProps) {
    const [passwordVisible, setPasswordVisible] = useState(false);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        message.success(`${label} copied to clipboard!`);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "wordpress":
                return "🔧";
            case "ssh":
            case "ftp":
                return "🖥️";
            case "database":
                return "🗄️";
            case "hosting":
                return "☁️";
            case "email":
                return "📧";
            default:
                return "🔑";
        }
    };

    return (
        <>
            <Head title="Shared Credential" />
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
                        maxWidth: 500,
                        width: "100%",
                        borderRadius: 16,
                        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                    }}
                >
                    <Space
                        direction="vertical"
                        size="large"
                        style={{ width: "100%" }}
                    >
                        {/* Header */}
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 48, marginBottom: 8 }}>
                                {getTypeIcon(credential.type)}
                            </div>
                            <Title level={3} style={{ margin: 0 }}>
                                {credential.title}
                            </Title>
                            {credential.project_name && (
                                <Text type="secondary">
                                    {credential.project_name}
                                </Text>
                            )}
                        </div>

                        {/* Security Notice */}
                        <Alert
                            message="Secure Credential Share"
                            description={
                                <Space direction="vertical" size={4}>
                                    <Text>
                                        <ClockCircleOutlined /> Expires:{" "}
                                        {expiresAt}
                                    </Text>
                                    <Text>
                                        <EyeOutlined /> Views remaining:{" "}
                                        {viewsRemaining}
                                    </Text>
                                    <Text>
                                        <UserOutlined /> Shared by: {sharedBy}
                                    </Text>
                                </Space>
                            }
                            type="info"
                            showIcon
                            icon={<SafetyOutlined />}
                        />

                        {/* Note from sender */}
                        {note && (
                            <Alert
                                message="Message from sender"
                                description={note}
                                type="warning"
                                showIcon
                            />
                        )}

                        {/* Credential Details */}
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Type">
                                <Text style={{ textTransform: "capitalize" }}>
                                    {credential.type}
                                </Text>
                            </Descriptions.Item>

                            {credential.username && (
                                <Descriptions.Item label="Username">
                                    <Space>
                                        <Text code>{credential.username}</Text>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<CopyOutlined />}
                                            onClick={() =>
                                                copyToClipboard(
                                                    credential.username!,
                                                    "Username"
                                                )
                                            }
                                        />
                                    </Space>
                                </Descriptions.Item>
                            )}

                            {credential.password && (
                                <Descriptions.Item label="Password">
                                    <Space>
                                        <Text code>
                                            {passwordVisible
                                                ? credential.password
                                                : "••••••••••••"}
                                        </Text>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={
                                                passwordVisible ? (
                                                    <EyeInvisibleOutlined />
                                                ) : (
                                                    <EyeOutlined />
                                                )
                                            }
                                            onClick={() =>
                                                setPasswordVisible(
                                                    !passwordVisible
                                                )
                                            }
                                        />
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<CopyOutlined />}
                                            onClick={() =>
                                                copyToClipboard(
                                                    credential.password!,
                                                    "Password"
                                                )
                                            }
                                        />
                                    </Space>
                                </Descriptions.Item>
                            )}

                            {credential.url && (
                                <Descriptions.Item label="URL">
                                    <Space>
                                        <a
                                            href={credential.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {credential.url}
                                        </a>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<CopyOutlined />}
                                            onClick={() =>
                                                copyToClipboard(
                                                    credential.url!,
                                                    "URL"
                                                )
                                            }
                                        />
                                    </Space>
                                </Descriptions.Item>
                            )}
                        </Descriptions>

                        {/* Copy All Button */}
                        <Button
                            type="primary"
                            block
                            size="large"
                            icon={<CopyOutlined />}
                            onClick={() => {
                                const parts = [];
                                if (credential.username)
                                    parts.push(
                                        `Username: ${credential.username}`
                                    );
                                if (credential.password)
                                    parts.push(
                                        `Password: ${credential.password}`
                                    );
                                if (credential.url)
                                    parts.push(`URL: ${credential.url}`);
                                copyToClipboard(
                                    parts.join("\n"),
                                    "All credentials"
                                );
                            }}
                        >
                            Copy All to Clipboard
                        </Button>

                        {/* Warning */}
                        <Text
                            type="secondary"
                            style={{
                                textAlign: "center",
                                display: "block",
                                fontSize: 12,
                            }}
                        >
                            <LockOutlined /> This link will expire after viewing
                            or at the specified time. Please save these
                            credentials securely.
                        </Text>
                    </Space>
                </Card>
            </div>
        </>
    );
}

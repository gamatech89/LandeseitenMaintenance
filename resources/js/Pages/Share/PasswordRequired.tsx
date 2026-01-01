import { Card, Form, Input, Button, Typography, Space, Alert } from "antd";
import { LockOutlined, SafetyOutlined } from "@ant-design/icons";
import { Head, router, usePage } from "@inertiajs/react";

const { Title, Text } = Typography;

interface PasswordRequiredProps {
    token: string;
    credentialTitle: string;
    projectName?: string;
    note?: string;
}

export default function PasswordRequired({
    token,
    credentialTitle,
    projectName,
    note,
}: PasswordRequiredProps) {
    const { errors } = usePage().props as { errors: { password?: string } };
    const [form] = Form.useForm();

    const handleSubmit = (values: { password: string }) => {
        router.post(
            `/share/credential/${token}/verify`,
            { password: values.password },
            { preserveScroll: true }
        );
    };

    return (
        <>
            <Head title="Password Required" />
            <div
                style={{
                    minHeight: "100vh",
                    background:
                        "linear-gradient(135deg, #6c1e9f 0%, #4a1470 100%)",
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
                    <Space
                        direction="vertical"
                        size="large"
                        style={{ width: "100%" }}
                    >
                        <div style={{ textAlign: "center" }}>
                            <div
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: "50%",
                                    background:
                                        "linear-gradient(135deg, #6c1e9f 0%, #4a1470 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 16px",
                                }}
                            >
                                <img
                                    src="/images/logo.png"
                                    alt="LSM Logo"
                                    style={{
                                        width: 50,
                                        height: 50,
                                        objectFit: "contain",
                                    }}
                                />
                            </div>
                            <Title level={3} style={{ margin: 0 }}>
                                Password Protected
                            </Title>
                            <Text type="secondary">
                                Enter the password to view this credential
                            </Text>
                        </div>

                        <Alert
                            message={credentialTitle}
                            description={
                                projectName
                                    ? `Project: ${projectName}`
                                    : undefined
                            }
                            type="info"
                            showIcon
                            icon={<SafetyOutlined />}
                        />

                        {note && (
                            <Alert
                                message="Message from sender"
                                description={note}
                                type="warning"
                                showIcon
                            />
                        )}

                        <Form
                            form={form}
                            onFinish={handleSubmit}
                            layout="vertical"
                        >
                            <Form.Item
                                name="password"
                                label="Access Password"
                                validateStatus={
                                    errors.password ? "error" : undefined
                                }
                                help={errors.password}
                                rules={[
                                    {
                                        required: true,
                                        message: "Please enter the password",
                                    },
                                ]}
                            >
                                <Input.Password
                                    size="large"
                                    placeholder="Enter password"
                                    prefix={<LockOutlined />}
                                />
                            </Form.Item>

                            <Form.Item style={{ marginBottom: 0 }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    block
                                >
                                    Unlock Credential
                                </Button>
                            </Form.Item>
                        </Form>

                        <Text
                            type="secondary"
                            style={{
                                textAlign: "center",
                                display: "block",
                                fontSize: 12,
                            }}
                        >
                            The password was provided by the person who shared
                            this credential with you.
                        </Text>
                    </Space>
                </Card>
            </div>
        </>
    );
}

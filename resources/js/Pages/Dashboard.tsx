import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { Card, Row, Col, Statistic, Tag, List, Badge, Space } from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    WarningOutlined,
    LoadingOutlined,
    LockOutlined,
    EyeOutlined,
    BugOutlined,
} from "@ant-design/icons";

interface Project {
    id: number;
    name: string;
    url: string;
    health_status: string;
    security_status: string;
}

interface DashboardProps {
    stats: {
        total: number;
        online: number;
        down: number;
        updating: number;
        secure: number;
        monitoring: number;
        compromised: number;
        hacked: number;
    };
    recentIssues: Project[];
}

export default function Dashboard({ stats, recentIssues }: DashboardProps) {
    const getHealthIcon = (status: string) => {
        switch (status) {
            case "online":
                return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
            case "down_error":
                return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
            case "updating":
                return <LoadingOutlined style={{ color: "#1890ff" }} />;
            default:
                return null;
        }
    };

    const getSecurityIcon = (status: string) => {
        switch (status) {
            case "secure":
                return <LockOutlined style={{ color: "#52c41a" }} />;
            case "monitoring":
                return <EyeOutlined style={{ color: "#faad14" }} />;
            case "compromised":
                return <WarningOutlined style={{ color: "#ff7a45" }} />;
            case "hacked":
                return <BugOutlined style={{ color: "#ff4d4f" }} />;
            default:
                return null;
        }
    };

    const getHealthColor = (status: string) => {
        switch (status) {
            case "online":
                return "success";
            case "down_error":
                return "error";
            case "updating":
                return "processing";
            default:
                return "default";
        }
    };

    const getSecurityColor = (status: string) => {
        switch (status) {
            case "secure":
                return "success";
            case "monitoring":
                return "warning";
            case "compromised":
                return "orange";
            case "hacked":
                return "error";
            default:
                return "default";
        }
    };

    return (
        <AuthenticatedLayout header="Dashboard">
            <Head title="Dashboard" />

            <Space direction="vertical" size="large" style={{ width: "100%" }}>
                {/* Critical Alerts */}
                {(stats.hacked > 0 ||
                    stats.down > 0 ||
                    stats.compromised > 0) && (
                    <Card>
                        <Space direction="vertical" style={{ width: "100%" }}>
                            {stats.hacked > 0 && (
                                <Badge.Ribbon text="CRITICAL" color="red">
                                    <Card
                                        size="small"
                                        style={{
                                            backgroundColor: "#fff1f0",
                                            borderColor: "#ffccc7",
                                        }}
                                    >
                                        <Space>
                                            <BugOutlined
                                                style={{
                                                    fontSize: "24px",
                                                    color: "#ff4d4f",
                                                }}
                                            />
                                            <div>
                                                <strong>
                                                    {stats.hacked} Site
                                                    {stats.hacked > 1
                                                        ? "s"
                                                        : ""}{" "}
                                                    Hacked
                                                </strong>
                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        color: "#8c8c8c",
                                                    }}
                                                >
                                                    Immediate action required!
                                                </div>
                                            </div>
                                        </Space>
                                    </Card>
                                </Badge.Ribbon>
                            )}
                            {stats.down > 0 && (
                                <Card
                                    size="small"
                                    style={{
                                        backgroundColor: "#fff1f0",
                                        borderColor: "#ffccc7",
                                    }}
                                >
                                    <Space>
                                        <CloseCircleOutlined
                                            style={{
                                                fontSize: "24px",
                                                color: "#ff4d4f",
                                            }}
                                        />
                                        <div>
                                            <strong>
                                                {stats.down} Site
                                                {stats.down > 1 ? "s" : ""} Down
                                            </strong>
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#8c8c8c",
                                                }}
                                            >
                                                Check server status
                                            </div>
                                        </div>
                                    </Space>
                                </Card>
                            )}
                            {stats.compromised > 0 && (
                                <Card
                                    size="small"
                                    style={{
                                        backgroundColor: "#fff7e6",
                                        borderColor: "#ffd591",
                                    }}
                                >
                                    <Space>
                                        <WarningOutlined
                                            style={{
                                                fontSize: "24px",
                                                color: "#fa8c16",
                                            }}
                                        />
                                        <div>
                                            <strong>
                                                {stats.compromised} Site
                                                {stats.compromised > 1
                                                    ? "s"
                                                    : ""}{" "}
                                                Compromised
                                            </strong>
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#8c8c8c",
                                                }}
                                            >
                                                Investigation in progress
                                            </div>
                                        </div>
                                    </Space>
                                </Card>
                            )}
                        </Space>
                    </Card>
                )}

                {/* Health Status */}
                <Card title="Health Status">
                    <Row gutter={16}>
                        <Col span={6}>
                            <Statistic
                                title="Total Projects"
                                value={stats.total}
                                valueStyle={{ color: "#1890ff" }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Online"
                                value={stats.online}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: "#52c41a" }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Down"
                                value={stats.down}
                                prefix={<CloseCircleOutlined />}
                                valueStyle={{ color: "#ff4d4f" }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Updating"
                                value={stats.updating}
                                prefix={<LoadingOutlined />}
                                valueStyle={{ color: "#1890ff" }}
                            />
                        </Col>
                    </Row>
                </Card>

                {/* Security Status */}
                <Card title="Security Status">
                    <Row gutter={16}>
                        <Col span={6}>
                            <Statistic
                                title="Secure"
                                value={stats.secure}
                                prefix={<LockOutlined />}
                                valueStyle={{ color: "#52c41a" }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Monitoring"
                                value={stats.monitoring}
                                prefix={<EyeOutlined />}
                                valueStyle={{ color: "#faad14" }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Compromised"
                                value={stats.compromised}
                                prefix={<WarningOutlined />}
                                valueStyle={{ color: "#ff7a45" }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Hacked"
                                value={stats.hacked}
                                prefix={<BugOutlined />}
                                valueStyle={{ color: "#ff4d4f" }}
                            />
                        </Col>
                    </Row>
                </Card>

                {/* Recent Issues */}
                {recentIssues.length > 0 && (
                    <Card
                        title="Recent Issues"
                        extra={
                            <Link href={route("projects.index")}>View All</Link>
                        }
                    >
                        <List
                            dataSource={recentIssues}
                            renderItem={(item) => (
                                <List.Item
                                    actions={[
                                        <Link
                                            href={route(
                                                "projects.show",
                                                item.id
                                            )}
                                            key="view"
                                        >
                                            View Details
                                        </Link>,
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={
                                            <Space>
                                                {item.name}
                                                <Tag
                                                    color={getHealthColor(
                                                        item.health_status
                                                    )}
                                                    icon={getHealthIcon(
                                                        item.health_status
                                                    )}
                                                >
                                                    {item.health_status
                                                        .replace("_", " ")
                                                        .toUpperCase()}
                                                </Tag>
                                                <Tag
                                                    color={getSecurityColor(
                                                        item.security_status
                                                    )}
                                                    icon={getSecurityIcon(
                                                        item.security_status
                                                    )}
                                                >
                                                    {item.security_status.toUpperCase()}
                                                </Tag>
                                            </Space>
                                        }
                                        description={item.url}
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                )}
            </Space>
        </AuthenticatedLayout>
    );
}

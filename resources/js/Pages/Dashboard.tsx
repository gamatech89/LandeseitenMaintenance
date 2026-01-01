import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import {
    Card,
    Row,
    Col,
    Statistic,
    Tag,
    List,
    Badge,
    Space,
    Typography,
    Progress,
    Avatar,
    Button,
    Tooltip,
} from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    WarningOutlined,
    ToolOutlined,
    LockOutlined,
    EyeOutlined,
    BugOutlined,
    RocketOutlined,
    ThunderboltOutlined,
    SafetyOutlined,
    AlertOutlined,
    ArrowRightOutlined,
    FolderOutlined,
    TeamOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

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
        offline: number;
        maintenance: number;
        secure: number;
        monitoring: number;
        at_risk: number;
        hacked: number;
    };
    recentIssues: Project[];
}

export default function Dashboard({ stats, recentIssues }: DashboardProps) {
    const { auth } = usePage().props as {
        auth: { user: { name: string; role: string } };
    };

    // Get current time greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    // Get current date formatted
    const getCurrentDate = () => {
        return new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Calculate health percentage
    const healthPercentage =
        stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0;
    const securityPercentage =
        stats.total > 0 ? Math.round((stats.secure / stats.total) * 100) : 0;
    const getHealthIcon = (status: string) => {
        switch (status) {
            case "online":
                return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
            case "offline":
            case "down_error":
                return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
            case "maintenance":
            case "updating":
                return <ToolOutlined style={{ color: "#8b5cf6" }} />;
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
            case "at_risk":
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
            case "offline":
            case "down_error":
                return "error";
            case "maintenance":
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
            case "at_risk":
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

            <Space direction="vertical" size={24} style={{ width: "100%" }}>
                {/* Welcome Banner */}
                <div className="welcome-banner">
                    <Row align="middle" justify="space-between">
                        <Col>
                            <Text
                                style={{
                                    color: "rgba(255,255,255,0.7)",
                                    fontSize: 14,
                                    display: "block",
                                    marginBottom: 4,
                                }}
                            >
                                {getCurrentDate()}
                            </Text>
                            <Title
                                level={2}
                                style={{
                                    color: "white",
                                    margin: 0,
                                    fontWeight: 600,
                                }}
                            >
                                {getGreeting()}, {auth.user.name}! 👋
                            </Title>
                            <Paragraph
                                style={{
                                    color: "rgba(255,255,255,0.8)",
                                    margin: "8px 0 0 0",
                                    fontSize: 15,
                                }}
                            >
                                Here's what's happening with your projects
                                today.
                            </Paragraph>
                        </Col>
                        <Col>
                            <Space size="middle">
                                <Link href={route("projects.index")}>
                                    <Button
                                        type="default"
                                        icon={<FolderOutlined />}
                                        style={{
                                            background:
                                                "rgba(255,255,255,0.15)",
                                            borderColor:
                                                "rgba(255,255,255,0.3)",
                                            color: "white",
                                        }}
                                    >
                                        View Projects
                                    </Button>
                                </Link>
                            </Space>
                        </Col>
                    </Row>
                </div>

                {/* Critical Alerts */}
                {(stats.hacked > 0 ||
                    stats.offline > 0 ||
                    stats.at_risk > 0) && (
                    <Row gutter={16}>
                        {stats.hacked > 0 && (
                            <Col xs={24} md={8}>
                                <Card
                                    className="stat-card stat-card-danger"
                                    style={{ cursor: "pointer" }}
                                    onClick={() =>
                                        (window.location.href = route(
                                            "projects.index",
                                            { security: "hacked" }
                                        ))
                                    }
                                >
                                    <div
                                        style={{
                                            position: "relative",
                                            zIndex: 1,
                                        }}
                                    >
                                        <Space align="start">
                                            <div
                                                style={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: 12,
                                                    background:
                                                        "rgba(255,255,255,0.2)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <BugOutlined
                                                    style={{
                                                        fontSize: 24,
                                                        color: "white",
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Text
                                                    style={{
                                                        color: "rgba(255,255,255,0.8)",
                                                        fontSize: 13,
                                                        display: "block",
                                                    }}
                                                >
                                                    CRITICAL ALERT
                                                </Text>
                                                <Title
                                                    level={3}
                                                    style={{
                                                        color: "white",
                                                        margin: "4px 0 0 0",
                                                    }}
                                                >
                                                    {stats.hacked} Hacked
                                                </Title>
                                                <Text
                                                    style={{
                                                        color: "rgba(255,255,255,0.7)",
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    Immediate action required
                                                </Text>
                                            </div>
                                        </Space>
                                    </div>
                                </Card>
                            </Col>
                        )}
                        {stats.offline > 0 && (
                            <Col xs={24} md={8}>
                                <Card
                                    className="stat-card stat-card-warning"
                                    style={{ cursor: "pointer" }}
                                    onClick={() =>
                                        (window.location.href = route(
                                            "projects.index",
                                            { health: "offline" }
                                        ))
                                    }
                                >
                                    <div
                                        style={{
                                            position: "relative",
                                            zIndex: 1,
                                        }}
                                    >
                                        <Space align="start">
                                            <div
                                                style={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: 12,
                                                    background:
                                                        "rgba(255,255,255,0.2)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <CloseCircleOutlined
                                                    style={{
                                                        fontSize: 24,
                                                        color: "white",
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Text
                                                    style={{
                                                        color: "rgba(255,255,255,0.8)",
                                                        fontSize: 13,
                                                        display: "block",
                                                    }}
                                                >
                                                    SITES DOWN
                                                </Text>
                                                <Title
                                                    level={3}
                                                    style={{
                                                        color: "white",
                                                        margin: "4px 0 0 0",
                                                    }}
                                                >
                                                    {stats.offline} Offline
                                                </Title>
                                                <Text
                                                    style={{
                                                        color: "rgba(255,255,255,0.7)",
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    Check server status
                                                </Text>
                                            </div>
                                        </Space>
                                    </div>
                                </Card>
                            </Col>
                        )}
                        {stats.at_risk > 0 && (
                            <Col xs={24} md={8}>
                                <Card
                                    className="stat-card"
                                    style={{
                                        cursor: "pointer",
                                        background:
                                            "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                                        border: "none",
                                    }}
                                    onClick={() =>
                                        (window.location.href = route(
                                            "projects.index",
                                            { security: "at_risk" }
                                        ))
                                    }
                                >
                                    <div
                                        style={{
                                            position: "relative",
                                            zIndex: 1,
                                        }}
                                    >
                                        <Space align="start">
                                            <div
                                                style={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: 12,
                                                    background:
                                                        "rgba(255,255,255,0.2)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <WarningOutlined
                                                    style={{
                                                        fontSize: 24,
                                                        color: "white",
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Text
                                                    style={{
                                                        color: "rgba(255,255,255,0.8)",
                                                        fontSize: 13,
                                                        display: "block",
                                                    }}
                                                >
                                                    AT RISK
                                                </Text>
                                                <Title
                                                    level={3}
                                                    style={{
                                                        color: "white",
                                                        margin: "4px 0 0 0",
                                                    }}
                                                >
                                                    {stats.at_risk} Sites
                                                </Title>
                                                <Text
                                                    style={{
                                                        color: "rgba(255,255,255,0.7)",
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    Investigation needed
                                                </Text>
                                            </div>
                                        </Space>
                                    </div>
                                </Card>
                            </Col>
                        )}
                    </Row>
                )}

                {/* Stats Overview */}
                <Row gutter={16}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="stat-card stat-card-primary" hoverable>
                            <div style={{ position: "relative", zIndex: 1 }}>
                                <Text
                                    style={{
                                        color: "rgba(255,255,255,0.8)",
                                        fontSize: 13,
                                        display: "block",
                                        textTransform: "uppercase",
                                        letterSpacing: 1,
                                    }}
                                >
                                    Total Projects
                                </Text>
                                <Title
                                    level={2}
                                    style={{
                                        color: "white",
                                        margin: "8px 0 0 0",
                                        fontWeight: 700,
                                    }}
                                >
                                    {stats.total}
                                </Title>
                                <Text
                                    style={{
                                        color: "rgba(255,255,255,0.7)",
                                        fontSize: 12,
                                    }}
                                >
                                    All managed sites
                                </Text>
                            </div>
                            <FolderOutlined className="stat-card-icon" />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="stat-card stat-card-success" hoverable>
                            <div style={{ position: "relative", zIndex: 1 }}>
                                <Text
                                    style={{
                                        color: "rgba(255,255,255,0.8)",
                                        fontSize: 13,
                                        display: "block",
                                        textTransform: "uppercase",
                                        letterSpacing: 1,
                                    }}
                                >
                                    Online
                                </Text>
                                <Title
                                    level={2}
                                    style={{
                                        color: "white",
                                        margin: "8px 0 0 0",
                                        fontWeight: 700,
                                    }}
                                >
                                    {stats.online}
                                </Title>
                                <Text
                                    style={{
                                        color: "rgba(255,255,255,0.7)",
                                        fontSize: 12,
                                    }}
                                >
                                    {healthPercentage}% healthy
                                </Text>
                            </div>
                            <CheckCircleOutlined className="stat-card-icon" />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="stat-card stat-card-info" hoverable>
                            <div style={{ position: "relative", zIndex: 1 }}>
                                <Text
                                    style={{
                                        color: "rgba(255,255,255,0.8)",
                                        fontSize: 13,
                                        display: "block",
                                        textTransform: "uppercase",
                                        letterSpacing: 1,
                                    }}
                                >
                                    Secure
                                </Text>
                                <Title
                                    level={2}
                                    style={{
                                        color: "white",
                                        margin: "8px 0 0 0",
                                        fontWeight: 700,
                                    }}
                                >
                                    {stats.secure}
                                </Title>
                                <Text
                                    style={{
                                        color: "rgba(255,255,255,0.7)",
                                        fontSize: 12,
                                    }}
                                >
                                    {securityPercentage}% protected
                                </Text>
                            </div>
                            <SafetyOutlined className="stat-card-icon" />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            className="stat-card"
                            style={{
                                background:
                                    "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                                border: "none",
                            }}
                            hoverable
                        >
                            <div style={{ position: "relative", zIndex: 1 }}>
                                <Text
                                    style={{
                                        color: "rgba(255,255,255,0.8)",
                                        fontSize: 13,
                                        display: "block",
                                        textTransform: "uppercase",
                                        letterSpacing: 1,
                                    }}
                                >
                                    Maintenance
                                </Text>
                                <Title
                                    level={2}
                                    style={{
                                        color: "white",
                                        margin: "8px 0 0 0",
                                        fontWeight: 700,
                                    }}
                                >
                                    {stats.maintenance}
                                </Title>
                                <Text
                                    style={{
                                        color: "rgba(255,255,255,0.7)",
                                        fontSize: 12,
                                    }}
                                >
                                    In progress
                                </Text>
                            </div>
                            <ToolOutlined className="stat-card-icon" />
                        </Card>
                    </Col>
                </Row>

                {/* Health & Security Progress */}
                <Row gutter={16}>
                    <Col xs={24} lg={12}>
                        <Card
                            title={
                                <Space>
                                    <ThunderboltOutlined
                                        style={{ color: "#10b981" }}
                                    />
                                    <span>Health Overview</span>
                                </Space>
                            }
                        >
                            <Row gutter={[16, 24]}>
                                <Col span={12}>
                                    <div style={{ textAlign: "center" }}>
                                        <Progress
                                            type="dashboard"
                                            percent={healthPercentage}
                                            strokeColor={{
                                                "0%": "#10b981",
                                                "100%": "#059669",
                                            }}
                                            format={(percent) => (
                                                <div>
                                                    <div
                                                        style={{
                                                            fontSize: 24,
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {percent}%
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            color: "#64748b",
                                                        }}
                                                    >
                                                        Healthy
                                                    </div>
                                                </div>
                                            )}
                                        />
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <Space
                                        direction="vertical"
                                        size={12}
                                        style={{ width: "100%" }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Space>
                                                <CheckCircleOutlined
                                                    style={{ color: "#10b981" }}
                                                />
                                                <Text>Online</Text>
                                            </Space>
                                            <Text strong>{stats.online}</Text>
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Space>
                                                <CloseCircleOutlined
                                                    style={{ color: "#ef4444" }}
                                                />
                                                <Text>Offline</Text>
                                            </Space>
                                            <Text strong>{stats.offline}</Text>
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Space>
                                                <ToolOutlined
                                                    style={{ color: "#8b5cf6" }}
                                                />
                                                <Text>Maintenance</Text>
                                            </Space>
                                            <Text strong>
                                                {stats.maintenance}
                                            </Text>
                                        </div>
                                    </Space>
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card
                            title={
                                <Space>
                                    <SafetyOutlined
                                        style={{ color: "#06b6d4" }}
                                    />
                                    <span>Security Overview</span>
                                </Space>
                            }
                        >
                            <Row gutter={[16, 24]}>
                                <Col span={12}>
                                    <div style={{ textAlign: "center" }}>
                                        <Progress
                                            type="dashboard"
                                            percent={securityPercentage}
                                            strokeColor={{
                                                "0%": "#06b6d4",
                                                "100%": "#0891b2",
                                            }}
                                            format={(percent) => (
                                                <div>
                                                    <div
                                                        style={{
                                                            fontSize: 24,
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {percent}%
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            color: "#64748b",
                                                        }}
                                                    >
                                                        Secure
                                                    </div>
                                                </div>
                                            )}
                                        />
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <Space
                                        direction="vertical"
                                        size={12}
                                        style={{ width: "100%" }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Space>
                                                <LockOutlined
                                                    style={{ color: "#10b981" }}
                                                />
                                                <Text>Secure</Text>
                                            </Space>
                                            <Text strong>{stats.secure}</Text>
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Space>
                                                <EyeOutlined
                                                    style={{ color: "#f59e0b" }}
                                                />
                                                <Text>Monitoring</Text>
                                            </Space>
                                            <Text strong>
                                                {stats.monitoring}
                                            </Text>
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Space>
                                                <WarningOutlined
                                                    style={{ color: "#ef4444" }}
                                                />
                                                <Text>At Risk</Text>
                                            </Space>
                                            <Text strong>
                                                {stats.at_risk + stats.hacked}
                                            </Text>
                                        </div>
                                    </Space>
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                </Row>

                {/* Recent Issues */}
                {recentIssues.length > 0 && (
                    <Card
                        title={
                            <Space>
                                <AlertOutlined style={{ color: "#ef4444" }} />
                                <span>Projects Requiring Attention</span>
                            </Space>
                        }
                        extra={
                            <Link href={route("projects.index")}>
                                <Button
                                    type="link"
                                    icon={<ArrowRightOutlined />}
                                >
                                    View All Projects
                                </Button>
                            </Link>
                        }
                    >
                        <List
                            dataSource={recentIssues}
                            renderItem={(item) => (
                                <List.Item
                                    style={{
                                        padding: "16px",
                                        borderRadius: 8,
                                        marginBottom: 8,
                                        background: "rgba(239, 68, 68, 0.04)",
                                        border: "1px solid rgba(239, 68, 68, 0.1)",
                                    }}
                                    actions={[
                                        <Link
                                            href={route(
                                                "projects.show",
                                                item.id
                                            )}
                                            key="view"
                                        >
                                            <Button type="primary" size="small">
                                                View Details
                                            </Button>
                                        </Link>,
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar
                                                style={{
                                                    background:
                                                        item.security_status ===
                                                        "hacked"
                                                            ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                                                            : item.health_status ===
                                                              "down_error"
                                                            ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                                                            : "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                                                }}
                                                icon={
                                                    item.security_status ===
                                                    "hacked" ? (
                                                        <BugOutlined />
                                                    ) : item.health_status ===
                                                      "down_error" ? (
                                                        <CloseCircleOutlined />
                                                    ) : (
                                                        <WarningOutlined />
                                                    )
                                                }
                                            />
                                        }
                                        title={
                                            <Space>
                                                <Text
                                                    strong
                                                    style={{ fontSize: 15 }}
                                                >
                                                    {item.name}
                                                </Text>
                                                <Tag
                                                    className={`status-tag-${item.health_status.replace(
                                                        "_",
                                                        "-"
                                                    )}`}
                                                >
                                                    {item.health_status
                                                        .replace("_", " ")
                                                        .toUpperCase()}
                                                </Tag>
                                                <Tag
                                                    className={`status-tag-${item.security_status}`}
                                                >
                                                    {item.security_status.toUpperCase()}
                                                </Tag>
                                            </Space>
                                        }
                                        description={
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: 13 }}
                                            >
                                                {item.url}
                                            </Text>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                )}

                {/* Quick Actions */}
                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <Link href={route("projects.index")}>
                            <Card
                                hoverable
                                style={{
                                    textAlign: "center",
                                    cursor: "pointer",
                                }}
                            >
                                <FolderOutlined
                                    style={{
                                        fontSize: 32,
                                        color: "#6c1e9f",
                                        marginBottom: 12,
                                    }}
                                />
                                <Title level={5} style={{ margin: 0 }}>
                                    Browse Projects
                                </Title>
                                <Text type="secondary">
                                    View and manage all projects
                                </Text>
                            </Card>
                        </Link>
                    </Col>
                    <Col xs={24} md={8}>
                        <Link href={route("vault.index")}>
                            <Card
                                hoverable
                                style={{
                                    textAlign: "center",
                                    cursor: "pointer",
                                }}
                            >
                                <LockOutlined
                                    style={{
                                        fontSize: 32,
                                        color: "#6c1e9f",
                                        marginBottom: 12,
                                    }}
                                />
                                <Title level={5} style={{ margin: 0 }}>
                                    Access Vault
                                </Title>
                                <Text type="secondary">
                                    Secure credentials storage
                                </Text>
                            </Card>
                        </Link>
                    </Col>
                    <Col xs={24} md={8}>
                        <Link href={route("activity.index")}>
                            <Card
                                hoverable
                                style={{
                                    textAlign: "center",
                                    cursor: "pointer",
                                }}
                            >
                                <ClockCircleOutlined
                                    style={{
                                        fontSize: 32,
                                        color: "#6c1e9f",
                                        marginBottom: 12,
                                    }}
                                />
                                <Title level={5} style={{ margin: 0 }}>
                                    Activity Log
                                </Title>
                                <Text type="secondary">
                                    View recent system activity
                                </Text>
                            </Card>
                        </Link>
                    </Col>
                </Row>
            </Space>
        </AuthenticatedLayout>
    );
}

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    Table,
    Tag,
    Input,
    Select,
    Space,
    Button,
    Card,
    message,
    Modal,
    Form,
    Typography,
    Divider,
    Tooltip,
    Avatar,
    Row,
    Col,
    Statistic,
    Empty,
    Spin,
} from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ToolOutlined,
    LockOutlined,
    EyeOutlined,
    WarningOutlined,
    BugOutlined,
    SearchOutlined,
    EyeOutlined as ViewIcon,
    PlusOutlined,
    UserOutlined,
    CodeOutlined,
    TeamOutlined,
    FilterOutlined,
    GlobalOutlined,
    FolderOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";

const { Search } = Input;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface User {
    id: number;
    name: string;
    role?: string;
}

interface Project {
    id: number;
    name: string;
    url: string;
    client_email: string;
    health_status: string;
    security_status: string;
    manager_id: number | null;
    developer_id: number | null;
    project_external_id: string | null;
    maintenance_id: string | null;
    manager: User | null;
    developer: User | null;
    developers: User[];
    updated_at: string;
}

interface ProjectsIndexProps {
    projects: {
        data: Project[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        health?: string;
        security?: string;
        search?: string;
        manager_id?: string;
        developer_id?: string;
    };
    users: User[];
    managers: User[];
    developers: User[];
}

export default function ProjectsIndex({
    projects,
    filters,
    users,
    managers,
    developers,
}: ProjectsIndexProps) {
    const { flash, auth } = usePage().props as {
        flash: { success?: string; error?: string };
        auth: { user: User & { role: string } };
    };
    const [searchValue, setSearchValue] = useState(filters.search || "");
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [updatingProjectId, setUpdatingProjectId] = useState<number | null>(
        null
    );
    const [updatingField, setUpdatingField] = useState<string | null>(null);

    const isAdmin = auth.user.role === "admin";
    const isManager = auth.user.role === "manager";

    // Inline status update handler
    const handleInlineStatusChange = (
        projectId: number,
        field: "health_status" | "security_status",
        value: string
    ) => {
        setUpdatingProjectId(projectId);
        setUpdatingField(field);

        router.put(
            route("projects.update", projectId),
            {
                [field]: value,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success(
                        `${
                            field === "health_status" ? "Health" : "Security"
                        } status updated!`
                    );
                    setUpdatingProjectId(null);
                    setUpdatingField(null);
                },
                onError: () => {
                    message.error("Failed to update status");
                    setUpdatingProjectId(null);
                    setUpdatingField(null);
                },
            }
        );
    };

    // Show flash messages
    useEffect(() => {
        if (flash?.success) {
            message.success(flash.success);
        }
        if (flash?.error) {
            message.error(flash.error);
        }
    }, [flash]);

    const getHealthIcon = (status: string) => {
        switch (status) {
            case "online":
                return <CheckCircleOutlined />;
            case "offline":
            case "down_error":
                return <CloseCircleOutlined />;
            case "maintenance":
            case "updating":
                return <ToolOutlined />;
            default:
                return null;
        }
    };

    const getSecurityIcon = (status: string) => {
        switch (status) {
            case "secure":
                return <LockOutlined />;
            case "monitoring":
                return <EyeOutlined />;
            case "at_risk":
            case "compromised":
                return <WarningOutlined />;
            case "hacked":
                return <BugOutlined />;
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

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            route("projects.index"),
            {
                ...filters,
                [key]: value,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleSearch = (value: string) => {
        router.get(
            route("projects.index"),
            {
                ...filters,
                search: value,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleCreateProject = (values: any) => {
        router.post(route("projects.store"), values, {
            onSuccess: () => {
                setCreateModalVisible(false);
                form.resetFields();
            },
            onError: () => {
                message.error("Failed to create project");
            },
        });
    };

    const columns = [
        {
            title: "External ID",
            dataIndex: "project_external_id",
            key: "project_external_id",
            width: 120,
            render: (id: string) => (
                <span
                    style={{
                        fontFamily: "monospace",
                        fontSize: 13,
                        color: id ? "#6c1e9f" : "#94a3b8",
                        fontWeight: 500,
                    }}
                >
                    {id || "—"}
                </span>
            ),
        },
        {
            title: "Maint. ID",
            dataIndex: "maintenance_id",
            key: "maintenance_id",
            width: 120,
            render: (id: string) => (
                <span
                    style={{
                        fontFamily: "monospace",
                        fontSize: 13,
                        color: id ? "#8b5cf6" : "#94a3b8",
                        fontWeight: 500,
                    }}
                >
                    {id || "—"}
                </span>
            ),
        },
        {
            title: "Project",
            dataIndex: "name",
            key: "name",
            render: (text: string, record: Project) => (
                <Link href={route("projects.show", record.id)}>
                    <Space>
                        <Avatar
                            size={32}
                            style={{
                                background:
                                    "linear-gradient(135deg, #6c1e9f 0%, #e46a28 100%)",
                                fontWeight: 600,
                                fontSize: 12,
                            }}
                        >
                            {text.charAt(0).toUpperCase()}
                        </Avatar>
                        <div>
                            <div
                                style={{
                                    fontWeight: 600,
                                    color: "#1e293b",
                                    fontSize: 14,
                                }}
                            >
                                {text}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                                {record.url
                                    ? new URL(
                                          record.url.startsWith("http")
                                              ? record.url
                                              : `https://${record.url}`
                                      ).hostname
                                    : "—"}
                            </div>
                        </div>
                    </Space>
                </Link>
            ),
        },
        {
            title: "Team",
            key: "team",
            width: 250,
            render: (_: unknown, record: Project) => (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {record.manager ? (
                        <Tooltip title={`PM: ${record.manager.name}`}>
                            <Tag
                                icon={<UserOutlined />}
                                style={{
                                    background: "rgba(108, 30, 159, 0.1)",
                                    color: "#6c1e9f",
                                    border: "1px solid rgba(108, 30, 159, 0.2)",
                                    borderRadius: 20,
                                }}
                            >
                                {record.manager.name}
                            </Tag>
                        </Tooltip>
                    ) : null}
                    {record.developers?.map((dev) => (
                        <Tooltip key={dev.id} title={`Dev: ${dev.name}`}>
                            <Tag
                                icon={<CodeOutlined />}
                                style={{
                                    background: "rgba(6, 182, 212, 0.1)",
                                    color: "#0891b2",
                                    border: "1px solid rgba(6, 182, 212, 0.2)",
                                    borderRadius: 20,
                                }}
                            >
                                {dev.name}
                            </Tag>
                        </Tooltip>
                    ))}
                    {!record.manager &&
                        (!record.developers ||
                            record.developers.length === 0) && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Unassigned
                            </Text>
                        )}
                </div>
            ),
        },
        {
            title: "Health",
            dataIndex: "health_status",
            key: "health_status",
            width: 140,
            render: (status: string, record: Project) => {
                const canEdit = isAdmin || isManager;
                const isUpdating =
                    updatingProjectId === record.id &&
                    updatingField === "health_status";

                if (canEdit) {
                    return (
                        <Spin spinning={isUpdating} size="small">
                            <Select
                                size="small"
                                style={{ width: 120 }}
                                value={status}
                                onChange={(value) =>
                                    handleInlineStatusChange(
                                        record.id,
                                        "health_status",
                                        value
                                    )
                                }
                                disabled={isUpdating}
                                options={[
                                    { value: "online", label: "🟢 Online" },
                                    {
                                        value: "down_error",
                                        label: "🔴 Offline",
                                    },
                                    {
                                        value: "updating",
                                        label: "🔧 Maintenance",
                                    },
                                ]}
                            />
                        </Spin>
                    );
                }

                return (
                    <Tag
                        className={`status-tag-${status.replace("_", "-")}`}
                        icon={getHealthIcon(status)}
                        style={{ borderRadius: 20, fontWeight: 500 }}
                    >
                        {status.replace("_", " ").toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: "Security",
            dataIndex: "security_status",
            key: "security_status",
            width: 140,
            render: (status: string, record: Project) => {
                const canEdit = isAdmin || isManager;
                const isUpdating =
                    updatingProjectId === record.id &&
                    updatingField === "security_status";

                if (canEdit) {
                    return (
                        <Spin spinning={isUpdating} size="small">
                            <Select
                                size="small"
                                style={{ width: 120 }}
                                value={status}
                                onChange={(value) =>
                                    handleInlineStatusChange(
                                        record.id,
                                        "security_status",
                                        value
                                    )
                                }
                                disabled={isUpdating}
                                options={[
                                    { value: "secure", label: "🔒 Secure" },
                                    {
                                        value: "monitoring",
                                        label: "👁 Monitoring",
                                    },
                                    {
                                        value: "compromised",
                                        label: "⚠️ At Risk",
                                    },
                                    { value: "hacked", label: "🐛 Hacked" },
                                ]}
                            />
                        </Spin>
                    );
                }

                return (
                    <Tag
                        className={`status-tag-${status}`}
                        icon={getSecurityIcon(status)}
                        style={{ borderRadius: 20, fontWeight: 500 }}
                    >
                        {status.toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: "",
            key: "actions",
            width: 80,
            render: (_: unknown, record: Project) => (
                <Link href={route("projects.show", record.id)}>
                    <Button
                        type="primary"
                        size="small"
                        icon={<ViewIcon />}
                        style={{ borderRadius: 8 }}
                    >
                        View
                    </Button>
                </Link>
            ),
        },
    ];

    return (
        <AuthenticatedLayout header="Projects">
            <Head title="Projects" />

            <Space direction="vertical" size={24} style={{ width: "100%" }}>
                {/* Stats Row */}
                <Row gutter={16}>
                    <Col xs={24} sm={12} md={6}>
                        <Card size="small">
                            <Statistic
                                title={
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 13 }}
                                    >
                                        Total Projects
                                    </Text>
                                }
                                value={projects.total}
                                prefix={
                                    <FolderOutlined
                                        style={{ color: "#6c1e9f" }}
                                    />
                                }
                                valueStyle={{
                                    color: "#6c1e9f",
                                    fontWeight: 700,
                                }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card size="small">
                            <Statistic
                                title={
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 13 }}
                                    >
                                        Online
                                    </Text>
                                }
                                value={
                                    projects.data.filter(
                                        (p) => p.health_status === "online"
                                    ).length
                                }
                                prefix={
                                    <CheckCircleOutlined
                                        style={{ color: "#10b981" }}
                                    />
                                }
                                valueStyle={{
                                    color: "#10b981",
                                    fontWeight: 700,
                                }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card size="small">
                            <Statistic
                                title={
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 13 }}
                                    >
                                        Secure
                                    </Text>
                                }
                                value={
                                    projects.data.filter(
                                        (p) => p.security_status === "secure"
                                    ).length
                                }
                                prefix={
                                    <LockOutlined
                                        style={{ color: "#06b6d4" }}
                                    />
                                }
                                valueStyle={{
                                    color: "#06b6d4",
                                    fontWeight: 700,
                                }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card size="small">
                            <Statistic
                                title={
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 13 }}
                                    >
                                        Issues
                                    </Text>
                                }
                                value={
                                    projects.data.filter(
                                        (p) =>
                                            p.health_status === "offline" ||
                                            p.health_status === "down_error" ||
                                            p.security_status === "hacked"
                                    ).length
                                }
                                prefix={
                                    <WarningOutlined
                                        style={{ color: "#ef4444" }}
                                    />
                                }
                                valueStyle={{
                                    color: "#ef4444",
                                    fontWeight: 700,
                                }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Main Card */}
                <Card
                    title={
                        <Space>
                            <FolderOutlined />
                            <span>All Projects</span>
                        </Space>
                    }
                    extra={
                        (isAdmin || isManager) && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    form.resetFields();
                                    form.setFieldsValue({
                                        health_status: "online",
                                        security_status: "secure",
                                    });
                                    setCreateModalVisible(true);
                                }}
                            >
                                New Project
                            </Button>
                        )
                    }
                >
                    <Space
                        direction="vertical"
                        size={16}
                        style={{ width: "100%" }}
                    >
                        {/* Filters */}
                        <div
                            style={{
                                background: "#f8fafc",
                                padding: 16,
                                borderRadius: 12,
                                border: "1px solid #e2e8f0",
                            }}
                        >
                            <Row gutter={[16, 16]} align="middle">
                                <Col xs={24} md={8}>
                                    <Input
                                        placeholder="Search projects..."
                                        value={searchValue}
                                        onChange={(e) =>
                                            setSearchValue(e.target.value)
                                        }
                                        onPressEnter={() =>
                                            handleSearch(searchValue)
                                        }
                                        prefix={
                                            <SearchOutlined
                                                style={{ color: "#94a3b8" }}
                                            />
                                        }
                                        allowClear
                                        onClear={() => handleSearch("")}
                                        style={{ borderRadius: 10 }}
                                    />
                                </Col>
                                <Col xs={12} md={4}>
                                    <Select
                                        placeholder="Health"
                                        style={{ width: "100%" }}
                                        value={filters.health || "all"}
                                        onChange={(value) =>
                                            handleFilterChange("health", value)
                                        }
                                        options={[
                                            {
                                                value: "all",
                                                label: "All Health",
                                            },
                                            {
                                                value: "online",
                                                label: "🟢 Online",
                                            },
                                            {
                                                value: "down_error",
                                                label: "🔴 Offline",
                                            },
                                            {
                                                value: "updating",
                                                label: "🔧 Maintenance",
                                            },
                                        ]}
                                    />
                                </Col>
                                <Col xs={12} md={4}>
                                    <Select
                                        placeholder="Security"
                                        style={{ width: "100%" }}
                                        value={filters.security || "all"}
                                        onChange={(value) =>
                                            handleFilterChange(
                                                "security",
                                                value
                                            )
                                        }
                                        options={[
                                            {
                                                value: "all",
                                                label: "All Security",
                                            },
                                            {
                                                value: "secure",
                                                label: "🔒 Secure",
                                            },
                                            {
                                                value: "monitoring",
                                                label: "👁 Monitoring",
                                            },
                                            {
                                                value: "compromised",
                                                label: "⚠️ At Risk",
                                            },
                                            {
                                                value: "hacked",
                                                label: "🐛 Hacked",
                                            },
                                        ]}
                                    />
                                </Col>
                                <Col xs={12} md={4}>
                                    <Select
                                        placeholder="Project Manager"
                                        style={{ width: "100%" }}
                                        allowClear
                                        value={filters.manager_id || undefined}
                                        onChange={(value) =>
                                            handleFilterChange(
                                                "manager_id",
                                                value || ""
                                            )
                                        }
                                        options={managers?.map((m) => ({
                                            value: String(m.id),
                                            label: m.name,
                                        }))}
                                    />
                                </Col>
                                <Col xs={12} md={4}>
                                    <Select
                                        placeholder="Developer"
                                        style={{ width: "100%" }}
                                        allowClear
                                        value={
                                            filters.developer_id || undefined
                                        }
                                        onChange={(value) =>
                                            handleFilterChange(
                                                "developer_id",
                                                value || ""
                                            )
                                        }
                                        options={developers?.map((d) => ({
                                            value: String(d.id),
                                            label: d.name,
                                        }))}
                                    />
                                </Col>
                            </Row>
                        </div>

                        {/* Table */}
                        <Table
                            columns={columns}
                            dataSource={projects.data}
                            rowKey="id"
                            scroll={{ x: 800 }}
                            locale={{
                                emptyText: (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={
                                            <span style={{ color: "#64748b" }}>
                                                No projects found.{" "}
                                                {(isAdmin || isManager) &&
                                                    "Create your first project to get started."}
                                            </span>
                                        }
                                    />
                                ),
                            }}
                            pagination={{
                                current: projects.current_page,
                                pageSize: projects.per_page,
                                total: projects.total,
                                showSizeChanger: false,
                                showTotal: (total, range) => (
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 13 }}
                                    >
                                        Showing {range[0]}-{range[1]} of {total}{" "}
                                        projects
                                    </Text>
                                ),
                                onChange: (page) => {
                                    router.get(
                                        route("projects.index"),
                                        { ...filters, page },
                                        {
                                            preserveState: true,
                                            preserveScroll: true,
                                        }
                                    );
                                },
                            }}
                        />
                    </Space>
                </Card>
            </Space>

            {/* Create Project Modal */}
            <Modal
                title="Create New Project"
                open={createModalVisible}
                onCancel={() => {
                    setCreateModalVisible(false);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                width={650}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateProject}
                    initialValues={{
                        health_status: "online",
                        security_status: "secure",
                    }}
                >
                    <Form.Item
                        name="project_external_id"
                        label="Project External ID"
                    >
                        <Input
                            placeholder="e.g., LP10001"
                            style={{ fontFamily: "monospace" }}
                        />
                    </Form.Item>
                    <Form.Item name="maintenance_id" label="Maintenance ID">
                        <Input
                            placeholder="e.g., WV10109"
                            style={{ fontFamily: "monospace" }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="name"
                        label="Project Name"
                        rules={[
                            {
                                required: true,
                                message: "Please enter project name",
                            },
                        ]}
                    >
                        <Input placeholder="Enter project name" />
                    </Form.Item>
                    <Form.Item
                        name="url"
                        label="Website URL"
                        rules={[
                            {
                                required: true,
                                message: "Please enter website URL",
                            },
                            {
                                type: "url",
                                message: "Please enter a valid URL",
                            },
                        ]}
                    >
                        <Input placeholder="https://example.com" />
                    </Form.Item>
                    <Form.Item
                        name="client_email"
                        label="Client Email"
                        rules={[
                            {
                                type: "email",
                                message: "Please enter a valid email",
                            },
                        ]}
                    >
                        <Input placeholder="client@example.com" />
                    </Form.Item>

                    <Divider orientation="left">
                        <Space>
                            <TeamOutlined />
                            Team Assignment
                        </Space>
                    </Divider>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="manager_id"
                                label="Project Manager (PM)"
                            >
                                <Select
                                    allowClear
                                    placeholder="Assign a PM"
                                    showSearch
                                    optionFilterProp="label"
                                    options={managers?.map((m) => ({
                                        value: m.id,
                                        label: m.name,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="developer_ids" label="Developers">
                                <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder="Assign Developers"
                                    showSearch
                                    optionFilterProp="label"
                                    options={developers?.map((d) => ({
                                        value: d.id,
                                        label: d.name,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left">Status</Divider>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="health_status"
                                label="Health Status"
                                rules={[
                                    {
                                        required: true,
                                        message: "Please select health status",
                                    },
                                ]}
                            >
                                <Select>
                                    <Select.Option value="online">
                                        🟢 Online
                                    </Select.Option>
                                    <Select.Option value="down_error">
                                        🔴 Offline
                                    </Select.Option>
                                    <Select.Option value="updating">
                                        🔧 Maintenance
                                    </Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="security_status"
                                label="Security Status"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select security status",
                                    },
                                ]}
                            >
                                <Select>
                                    <Select.Option value="secure">
                                        🔒 Secure
                                    </Select.Option>
                                    <Select.Option value="monitoring">
                                        👁 Monitoring
                                    </Select.Option>
                                    <Select.Option value="compromised">
                                        ⚠️ At Risk
                                    </Select.Option>
                                    <Select.Option value="hacked">
                                        🐛 Hacked
                                    </Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="notes" label="Notes">
                        <TextArea rows={4} placeholder="Project notes..." />
                    </Form.Item>
                </Form>
            </Modal>
        </AuthenticatedLayout>
    );
}

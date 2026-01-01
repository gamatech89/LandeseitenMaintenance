import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, Link, usePage } from "@inertiajs/react";
import {
    Card,
    Table,
    Space,
    Typography,
    Tag,
    Input,
    Select,
    Button,
    message,
    Tooltip,
    Popover,
    Modal,
    Form,
    Switch,
    InputNumber,
    Checkbox,
    Result,
    Popconfirm,
} from "antd";
import {
    SearchOutlined,
    LockOutlined,
    GlobalOutlined,
    DatabaseOutlined,
    MailOutlined,
    CloudOutlined,
    CloudServerOutlined,
    ApiOutlined,
    KeyOutlined,
    CopyOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    LinkOutlined,
    InfoCircleOutlined,
    EditOutlined,
    ShareAltOutlined,
    ClockCircleOutlined,
    SafetyOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import axios from "axios";

const { Title, Text } = Typography;

interface CredentialMetadata {
    hostname?: string;
    port?: number | string;
    host?: string;
    database_name?: string;
}

interface Project {
    id: number;
    name: string;
    url: string;
}

interface Credential {
    id: number;
    project_id: number;
    title: string;
    type: string;
    username: string;
    password: string;
    url: string;
    metadata: CredentialMetadata | null;
    project: Project;
}

interface PaginatedCredentials {
    data: Credential[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    credentials: PaginatedCredentials;
    projects: { id: number; name: string }[];
    filters: {
        search?: string;
        type?: string;
        project_id?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Index({
    credentials,
    projects,
    filters,
    flash,
}: Props) {
    const { auth } = usePage().props as {
        auth: { user: { name: string; role: string } };
    };
    const isAdmin = auth.user.role === "admin";
    
    const [visiblePasswords, setVisiblePasswords] = useState<
        Record<number, boolean>
    >({});
    const [revealedPasswords, setRevealedPasswords] = useState<
        Record<number, string>
    >({});
    const [loadingPasswords, setLoadingPasswords] = useState<
        Record<number, boolean>
    >({});
    const [searchValue, setSearchValue] = useState(filters.search || "");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCredential, setEditingCredential] =
        useState<Credential | null>(null);
    const [form] = Form.useForm();

    // Share modal state
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [sharingCredential, setSharingCredential] =
        useState<Credential | null>(null);
    const [shareForm] = Form.useForm();
    const [createdShareLink, setCreatedShareLink] = useState<string | null>(
        null
    );
    const [shareLoading, setShareLoading] = useState(false);

    // Show flash messages
    useEffect(() => {
        if (flash?.success) {
            message.success(flash.success);
        }
        if (flash?.error) {
            message.error(flash.error);
        }
    }, [flash]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "wordpress":
                return <GlobalOutlined />;
            case "hosting":
                return <CloudOutlined />;
            case "database":
                return <DatabaseOutlined />;
            case "email":
                return <MailOutlined />;
            case "ssh":
            case "ftp":
                return <CloudServerOutlined />;
            case "api":
                return <ApiOutlined />;
            default:
                return <KeyOutlined />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "wordpress":
                return "purple";
            case "hosting":
                return "green";
            case "database":
                return "orange";
            case "email":
                return "magenta";
            case "ssh":
                return "cyan";
            case "ftp":
                return "blue";
            case "api":
                return "gold";
            default:
                return "default";
        }
    };

    const renderMetadataPopover = (credential: Credential) => {
        const meta = credential.metadata;
        if (!meta || Object.keys(meta).length === 0) return null;

        const content = (
            <div style={{ minWidth: 200 }}>
                {meta.hostname && (
                    <div style={{ marginBottom: 8 }}>
                        <Text type="secondary">Hostname: </Text>
                        <Text strong copyable>
                            {meta.hostname}
                        </Text>
                    </div>
                )}
                {meta.host && (
                    <div style={{ marginBottom: 8 }}>
                        <Text type="secondary">Host: </Text>
                        <Text strong copyable>
                            {meta.host}
                        </Text>
                    </div>
                )}
                {meta.port && (
                    <div style={{ marginBottom: 8 }}>
                        <Text type="secondary">Port: </Text>
                        <Text strong copyable>
                            {String(meta.port)}
                        </Text>
                    </div>
                )}
                {meta.database_name && (
                    <div style={{ marginBottom: 8 }}>
                        <Text type="secondary">Database: </Text>
                        <Text strong copyable>
                            {meta.database_name}
                        </Text>
                    </div>
                )}
            </div>
        );

        return (
            <Popover
                content={content}
                title="Connection Details"
                trigger="click"
            >
                <Button
                    type="text"
                    size="small"
                    icon={<InfoCircleOutlined style={{ color: "#6c1e9f" }} />}
                />
            </Popover>
        );
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        message.success(`${label} copied to clipboard`);
    };

    const togglePassword = async (id: number) => {
        // If already visible, just hide it
        if (visiblePasswords[id]) {
            setVisiblePasswords((prev) => ({
                ...prev,
                [id]: false,
            }));
            return;
        }

        // If we already have the password cached, show it
        if (revealedPasswords[id]) {
            setVisiblePasswords((prev) => ({
                ...prev,
                [id]: true,
            }));
            return;
        }

        // Fetch the password from the server
        setLoadingPasswords((prev) => ({ ...prev, [id]: true }));
        try {
            const response = await fetch(
                route("vault.reveal", { credential: id })
            );
            if (!response.ok) {
                throw new Error("Failed to reveal password");
            }
            const data = await response.json();
            setRevealedPasswords((prev) => ({ ...prev, [id]: data.password }));
            setVisiblePasswords((prev) => ({ ...prev, [id]: true }));
        } catch (error) {
            message.error("Failed to reveal password");
        } finally {
            setLoadingPasswords((prev) => ({ ...prev, [id]: false }));
        }
    };

    const handleEdit = (credential: Credential) => {
        setEditingCredential(credential);
        form.setFieldsValue({
            title: credential.title,
            type: credential.type,
            username: credential.username,
            password: credential.password,
            url: credential.url,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (editingCredential) {
                router.put(
                    route("credentials.update", {
                        project: editingCredential.project_id,
                        credential: editingCredential.id,
                    }),
                    values,
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            setIsEditModalOpen(false);
                            setEditingCredential(null);
                            form.resetFields();
                        },
                    }
                );
            }
        } catch (error) {
            console.error("Validation failed:", error);
        }
    };

    const handleDelete = (credential: Credential) => {
        router.delete(route("vault.destroy", { credential: credential.id }), {
            preserveScroll: true,
            onSuccess: () => {
                message.success("Credential deleted successfully");
            },
            onError: () => {
                message.error("Failed to delete credential");
            },
        });
    };

    // Share functionality
    const handleOpenShareModal = (credential: Credential) => {
        setSharingCredential(credential);
        setCreatedShareLink(null);
        shareForm.resetFields();
        shareForm.setFieldsValue({
            expires_in: "24h",
            max_views: 5,
            password_protected: false,
            show_username: true,
            show_password: true,
            show_url: true,
        });
        setShareModalVisible(true);
    };

    const handleCreateShareLink = async () => {
        if (!sharingCredential) return;

        try {
            const values = await shareForm.validateFields();
            setShareLoading(true);

            const response = await axios.post(
                route("credentials.share.store", {
                    project: sharingCredential.project_id,
                    credential: sharingCredential.id,
                }),
                {
                    expires_in: values.expires_in,
                    max_views: values.max_views || 5,
                    access_password: values.password_protected
                        ? values.access_password
                        : null,
                    recipient_email: values.recipient_email || null,
                    show_username: values.show_username ?? true,
                    show_password: values.show_password ?? true,
                    show_url: values.show_url ?? true,
                }
            );

            setCreatedShareLink(response.data.share_url);
            message.success("Share link created successfully!");
        } catch (error: any) {
            message.error(
                error.response?.data?.message || "Failed to create share link"
            );
        } finally {
            setShareLoading(false);
        }
    };

    const copyShareLink = () => {
        if (createdShareLink) {
            navigator.clipboard.writeText(createdShareLink);
            message.success("Share link copied to clipboard!");
        }
    };

    const columns = [
        {
            title: "Project",
            key: "project",
            render: (_: unknown, record: Credential) => (
                <Link href={route("projects.show", record.project_id)}>
                    <Text strong style={{ color: "#6c1e9f" }}>
                        {record.project?.name}
                    </Text>
                </Link>
            ),
        },
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            render: (title: string, record: Credential) => (
                <Space>
                    {getTypeIcon(record.type)}
                    {title}
                </Space>
            ),
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            render: (type: string) => (
                <Tag color={getTypeColor(type)}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                </Tag>
            ),
        },
        {
            title: "Username",
            dataIndex: "username",
            key: "username",
            render: (username: string) => (
                <Space>
                    <Text>{username}</Text>
                    <Tooltip title="Copy username">
                        <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() =>
                                copyToClipboard(username, "Username")
                            }
                        />
                    </Tooltip>
                </Space>
            ),
        },
        {
            title: "Password",
            key: "password",
            render: (_: unknown, record: Credential) => (
                <Space>
                    <Text>
                        {visiblePasswords[record.id] &&
                        revealedPasswords[record.id]
                            ? revealedPasswords[record.id]
                            : "••••••••"}
                    </Text>
                    <Tooltip
                        title={visiblePasswords[record.id] ? "Hide" : "Show"}
                    >
                        <Button
                            type="text"
                            size="small"
                            loading={loadingPasswords[record.id]}
                            icon={
                                visiblePasswords[record.id] ? (
                                    <EyeInvisibleOutlined />
                                ) : (
                                    <EyeOutlined />
                                )
                            }
                            onClick={() => togglePassword(record.id)}
                        />
                    </Tooltip>
                    <Tooltip title="Copy password">
                        <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={async () => {
                                // Fetch password if not already cached
                                if (!revealedPasswords[record.id]) {
                                    try {
                                        const response = await fetch(
                                            route("vault.reveal", {
                                                credential: record.id,
                                            })
                                        );
                                        if (!response.ok) throw new Error();
                                        const data = await response.json();
                                        setRevealedPasswords((prev) => ({
                                            ...prev,
                                            [record.id]: data.password,
                                        }));
                                        copyToClipboard(
                                            data.password,
                                            "Password"
                                        );
                                    } catch {
                                        message.error(
                                            "Failed to copy password"
                                        );
                                    }
                                } else {
                                    copyToClipboard(
                                        revealedPasswords[record.id],
                                        "Password"
                                    );
                                }
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
        {
            title: "URL",
            dataIndex: "url",
            key: "url",
            render: (url: string) =>
                url ? (
                    <Space>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#6c1e9f" }}
                        >
                            <LinkOutlined /> Open
                        </a>
                        <Tooltip title="Copy URL">
                            <Button
                                type="text"
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => copyToClipboard(url, "URL")}
                            />
                        </Tooltip>
                    </Space>
                ) : (
                    <Text type="secondary">-</Text>
                ),
        },
        {
            title: "Details",
            key: "metadata",
            render: (_: unknown, record: Credential) =>
                renderMetadataPopover(record),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: unknown, record: Credential) => (
                <Space>
                    <Tooltip title="Share credential">
                        <Button
                            type="text"
                            icon={
                                <ShareAltOutlined
                                    style={{ color: "#6c1e9f" }}
                                />
                            }
                            onClick={() => handleOpenShareModal(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Edit credential">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    {isAdmin && (
                        <Popconfirm
                            title="Delete credential"
                            description="Are you sure you want to delete this credential? This action cannot be undone."
                            onConfirm={() => handleDelete(record)}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                        >
                            <Tooltip title="Delete credential">
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                />
                            </Tooltip>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    const handleSearch = (value: string) => {
        router.get(
            route("vault.index"),
            {
                ...filters,
                search: value || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleTypeFilter = (value: string) => {
        router.get(
            route("vault.index"),
            {
                ...filters,
                type: value || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleProjectFilter = (value: string) => {
        router.get(
            route("vault.index"),
            {
                ...filters,
                project_id: value || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleTableChange = (pagination: { current?: number }) => {
        router.get(
            route("vault.index"),
            {
                ...filters,
                page: pagination.current,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <Title level={4} style={{ margin: 0 }}>
                    <LockOutlined /> Vault - All Credentials
                </Title>
            }
        >
            <Head title="Vault" />

            <Card>
                <Space style={{ marginBottom: 16, width: "100%" }} wrap>
                    <Input.Search
                        placeholder="Search credentials..."
                        allowClear
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onSearch={handleSearch}
                        style={{ width: "100%", maxWidth: 300 }}
                        prefix={<SearchOutlined />}
                    />
                    <Select
                        placeholder="Filter by type"
                        allowClear
                        style={{ width: 150 }}
                        value={filters.type}
                        onChange={handleTypeFilter}
                        options={[
                            { value: "wordpress", label: "WordPress" },
                            { value: "ssh", label: "SSH" },
                            { value: "ftp", label: "FTP" },
                            { value: "database", label: "Database" },
                            { value: "hosting", label: "Hosting" },
                            { value: "email", label: "Email" },
                            { value: "api", label: "API" },
                            { value: "other", label: "Other" },
                        ]}
                    />
                    <Select
                        placeholder="Filter by project"
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        style={{ width: 200 }}
                        value={filters.project_id}
                        onChange={handleProjectFilter}
                        options={projects.map((p) => ({
                            value: String(p.id),
                            label: p.name,
                        }))}
                    />
                </Space>

                <Table
                    columns={columns}
                    dataSource={credentials.data}
                    rowKey="id"
                    scroll={{ x: 900 }}
                    pagination={{
                        current: credentials.current_page,
                        pageSize: credentials.per_page,
                        total: credentials.total,
                        showSizeChanger: false,
                        showTotal: (total) => `Total ${total} credentials`,
                    }}
                    onChange={handleTableChange}
                />
            </Card>

            {/* Edit Credential Modal */}
            <Modal
                title="Edit Credential"
                open={isEditModalOpen}
                onOk={handleEditSubmit}
                onCancel={() => {
                    setIsEditModalOpen(false);
                    setEditingCredential(null);
                    form.resetFields();
                }}
                okText="Update"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[
                            { required: true, message: "Please enter title" },
                        ]}
                    >
                        <Input placeholder="Credential title" />
                    </Form.Item>

                    <Form.Item
                        name="type"
                        label="Type"
                        rules={[
                            { required: true, message: "Please select type" },
                        ]}
                    >
                        <Select
                            placeholder="Select type"
                            options={[
                                { value: "wordpress", label: "WordPress" },
                                { value: "ssh", label: "SSH" },
                                { value: "ftp", label: "FTP" },
                                { value: "database", label: "Database" },
                                { value: "hosting", label: "Hosting" },
                                { value: "email", label: "Email" },
                                { value: "api", label: "API" },
                                { value: "other", label: "Other" },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        name="username"
                        label="Username"
                        rules={[
                            {
                                required: true,
                                message: "Please enter username",
                            },
                        ]}
                    >
                        <Input placeholder="Username" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[
                            {
                                required: true,
                                message: "Please enter password",
                            },
                        ]}
                    >
                        <Input.Password placeholder="Password" />
                    </Form.Item>

                    <Form.Item name="url" label="URL">
                        <Input placeholder="Login URL (optional)" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Share Credential Modal */}
            <Modal
                title={
                    <Space>
                        <ShareAltOutlined style={{ color: "#6c1e9f" }} />
                        Share Credential: {sharingCredential?.title}
                    </Space>
                }
                open={shareModalVisible}
                onCancel={() => {
                    setShareModalVisible(false);
                    setSharingCredential(null);
                    setCreatedShareLink(null);
                    shareForm.resetFields();
                }}
                footer={
                    createdShareLink ? (
                        <Button
                            onClick={() => {
                                setShareModalVisible(false);
                                setSharingCredential(null);
                                setCreatedShareLink(null);
                            }}
                        >
                            Close
                        </Button>
                    ) : (
                        <Space>
                            <Button onClick={() => setShareModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleCreateShareLink}
                                loading={shareLoading}
                                icon={<ShareAltOutlined />}
                            >
                                Create Share Link
                            </Button>
                        </Space>
                    )
                }
                width={500}
            >
                {createdShareLink ? (
                    <Result
                        status="success"
                        title="Share Link Created!"
                        subTitle="Copy the link below and share it with the recipient."
                        extra={[
                            <Input.Group
                                compact
                                key="link"
                                style={{ display: "flex" }}
                            >
                                <Input
                                    value={createdShareLink}
                                    readOnly
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    type="primary"
                                    icon={<CopyOutlined />}
                                    onClick={copyShareLink}
                                >
                                    Copy
                                </Button>
                            </Input.Group>,
                        ]}
                    />
                ) : (
                    <Form form={shareForm} layout="vertical">
                        <Form.Item
                            name="expires_in"
                            label={
                                <Space>
                                    <ClockCircleOutlined />
                                    Link Expiration
                                </Space>
                            }
                            rules={[{ required: true }]}
                        >
                            <Select
                                options={[
                                    { value: "1h", label: "1 hour" },
                                    { value: "6h", label: "6 hours" },
                                    { value: "24h", label: "24 hours" },
                                    { value: "48h", label: "2 days" },
                                    { value: "7d", label: "7 days" },
                                ]}
                            />
                        </Form.Item>

                        <Form.Item
                            name="max_views"
                            label="Maximum Views (optional)"
                            tooltip="Leave empty for unlimited views"
                        >
                            <InputNumber
                                min={1}
                                max={100}
                                placeholder="Unlimited"
                                style={{ width: "100%" }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="password_protected"
                            valuePropName="checked"
                            label={
                                <Space>
                                    <SafetyOutlined />
                                    Password Protection
                                </Space>
                            }
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) =>
                                prevValues.password_protected !==
                                currentValues.password_protected
                            }
                        >
                            {({ getFieldValue }) =>
                                getFieldValue("password_protected") && (
                                    <Form.Item
                                        name="access_password"
                                        label="Share Password"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    "Please enter a password",
                                            },
                                            {
                                                min: 4,
                                                message:
                                                    "Password must be at least 4 characters",
                                            },
                                        ]}
                                    >
                                        <Input.Password placeholder="Enter password for the share link" />
                                    </Form.Item>
                                )
                            }
                        </Form.Item>

                        <Form.Item
                            name="recipient_email"
                            label="Recipient Email (optional)"
                            tooltip="For audit trail purposes"
                        >
                            <Input placeholder="recipient@example.com" />
                        </Form.Item>

                        <Form.Item label="Fields to Share">
                            <Space direction="vertical">
                                <Form.Item
                                    name="show_username"
                                    valuePropName="checked"
                                    noStyle
                                >
                                    <Checkbox>Username</Checkbox>
                                </Form.Item>
                                <Form.Item
                                    name="show_password"
                                    valuePropName="checked"
                                    noStyle
                                >
                                    <Checkbox>Password</Checkbox>
                                </Form.Item>
                                <Form.Item
                                    name="show_url"
                                    valuePropName="checked"
                                    noStyle
                                >
                                    <Checkbox>URL</Checkbox>
                                </Form.Item>
                            </Space>
                        </Form.Item>
                    </Form>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}

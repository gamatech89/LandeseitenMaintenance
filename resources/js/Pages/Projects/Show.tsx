import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";
import {
    Card,
    Tabs,
    Tag,
    Descriptions,
    Table,
    Button,
    Space,
    Typography,
    Badge,
    Modal,
    Form,
    Input,
    Select,
    Checkbox,
    DatePicker,
    Popconfirm,
    message,
    Upload,
    Popover,
    Tooltip,
    Row,
    Col,
    Divider,
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
    CopyOutlined,
    EyeInvisibleOutlined,
    LinkOutlined,
    FileOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    DownloadOutlined,
    UploadOutlined,
    InfoCircleOutlined,
    PaperClipOutlined,
    GlobalOutlined,
    DatabaseOutlined,
    CloudServerOutlined,
    MailOutlined,
    ApiOutlined,
    KeyOutlined,
    TeamOutlined,
    ShareAltOutlined,
    ClockCircleOutlined,
    SafetyOutlined,
    SettingOutlined,
    SyncOutlined,
    FileTextOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { usePage } from "@inertiajs/react";
import MaintenanceReportsTab from "@/Components/MaintenanceReportsTab";

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

interface CredentialMetadata {
    hostname?: string;
    port?: number | string;
    host?: string;
    database_name?: string;
    [key: string]: string | number | undefined;
}

interface Credential {
    id: number;
    title: string;
    type: string;
    username: string;
    password: string;
    url: string;
    metadata: CredentialMetadata | null;
}

interface Resource {
    id: number;
    title: string;
    type: string;
    url: string;
    file_path: string;
    file_name: string;
    file_size: number;
    notes: string;
}

interface Todo {
    id: number;
    title: string;
    description: string;
    completed: boolean;
    status: "pending" | "in_progress" | "completed";
    priority: number;
    due_date: string;
    completed_at?: string;
    file_path: string | null;
    file_name: string | null;
    assignee_id: number | null;
    assignee: { id: number; name: string } | null;
}

interface Project {
    id: number;
    name: string;
    url: string;
    client_email: string;
    notes: string;
    health_status: string;
    security_status: string;
    manager_id: number | null;
    developer_id: number | null;
    project_external_id: string | null;
    maintenance_id: string | null;
    manager: { id: number; name: string } | null;
    developer: { id: number; name: string } | null;
    developers: { id: number; name: string }[];
    created_at: string;
    updated_at: string;
    credentials: Credential[];
    resources: Resource[];
    todos: Todo[];
    // Health monitoring fields
    health_check_secret: string | null;
    response_time_ms: number | null;
    last_health_check_at: string | null;
    ssl_status: string | null;
    ssl_expires_at: string | null;
    wp_version: string | null;
    php_version: string | null;
    outdated_plugins_count: number | null;
    last_health_details: {
        // Success response fields
        status?: string;
        wordpress?: { version: string };
        php?: { version: string };
        plugins?: {
            total_count: number;
            active_count: number;
            outdated_count: number;
            outdated_plugins?: {
                name: string;
                current_version: string;
                new_version: string;
            }[];
        };
        theme?: { name: string; version: string; update_available?: boolean };
        ssl?: { enabled: boolean };
        updates?: { core_update_available: boolean; core_new_version?: string };
        security?: { debug_mode: boolean; file_editing_disabled: boolean };
        disk?: { free_space?: string; total_space?: string };
        performance?: { memory_usage?: string };
        // Landeseiten Stack
        landeseiten_stack?: {
            stack_complete: boolean;
            hello_elementor: { active: boolean; version?: string };
            child_theme: { active: boolean; name?: string; version?: string };
            gravity_plugin: { active: boolean; version?: string };
            issues?: string[];
        };
        // Error response fields
        error?: boolean;
        error_type?: "http_error" | "connection_error";
        error_code?: number;
        error_message?: string;
        checked_at?: string;
    } | null;
}

interface User {
    id: number;
    name: string;
    role?: string;
}

interface MaintenanceReport {
    id: number;
    project_id: number;
    user_id: number;
    report_date: string;
    type: "monthly" | "weekly" | "ad-hoc";
    summary: string;
    tasks_completed?: string[];
    updates_performed?: string[];
    issues_found?: string[];
    issues_resolved?: string[];
    notes?: string;
    time_spent_minutes?: number;
    user?: User;
    created_at: string;
    updated_at: string;
}

interface ProjectShowProps {
    project: Project;
    maintenanceReports: MaintenanceReport[];
    users: User[];
    managers: User[];
    developers: User[];
}

export default function ProjectShow({
    project,
    maintenanceReports,
    users,
    managers,
    developers,
}: ProjectShowProps) {
    const { flash, auth } = usePage().props as {
        flash: { success?: string; error?: string };
        auth: { user: User & { role: string } };
    };

    const isAdmin = auth.user.role === "admin";
    const isManager = auth.user.role === "manager";
    const isDeveloper = auth.user.role === "developer";

    const [visiblePasswords, setVisiblePasswords] = useState<{
        [key: number]: boolean;
    }>({});
    const [credentialModalVisible, setCredentialModalVisible] = useState(false);
    const [todoModalVisible, setTodoModalVisible] = useState(false);
    const [todoViewModalVisible, setTodoViewModalVisible] = useState(false);
    const [viewingTodo, setViewingTodo] = useState<Todo | null>(null);
    const [projectModalVisible, setProjectModalVisible] = useState(false);
    const [resourceModalVisible, setResourceModalVisible] = useState(false);
    const [editingCredential, setEditingCredential] =
        useState<Credential | null>(null);
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
    const [editingResource, setEditingResource] = useState<Resource | null>(
        null
    );
    const [resourceType, setResourceType] = useState<string>("link");
    const [fileList, setFileList] = useState<any[]>([]);
    const [todoFileList, setTodoFileList] = useState<any[]>([]);
    const [credentialType, setCredentialType] = useState<string>("wordpress");

    const [credentialForm] = Form.useForm();
    const [todoForm] = Form.useForm();
    const [projectForm] = Form.useForm();
    const [resourceForm] = Form.useForm();
    const [shareForm] = Form.useForm();
    const [updatingTodoId, setUpdatingTodoId] = useState<number | null>(null);

    // Share link state
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [sharingCredential, setSharingCredential] =
        useState<Credential | null>(null);
    const [shareLoading, setShareLoading] = useState(false);
    const [generatedShareUrl, setGeneratedShareUrl] = useState<string | null>(
        null
    );

    // Health monitoring state
    const [healthSecretModalVisible, setHealthSecretModalVisible] =
        useState(false);
    const [healthSecretForm] = Form.useForm();
    const [healthCheckLoading, setHealthCheckLoading] = useState(false);

    // Inline assignee update handler
    const handleInlineAssigneeChange = (
        todoId: number,
        assigneeId: number | null
    ) => {
        setUpdatingTodoId(todoId);
        router.put(
            route("todos.update", [project.id, todoId]),
            {
                assignee_id: assigneeId || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success("Assignee updated!");
                    setUpdatingTodoId(null);
                },
                onError: () => {
                    message.error("Failed to update assignee");
                    setUpdatingTodoId(null);
                },
            }
        );
    };

    // Build assignee options for inline select
    const getAssigneeOptions = () => {
        const options: { value: number; label: string }[] = [];

        // Add project manager if exists
        if (project.manager) {
            options.push({
                value: project.manager.id,
                label: `${project.manager.name} (PM)`,
            });
        }

        // Add all project developers
        if (project.developers) {
            project.developers.forEach((d) => {
                // Avoid duplicates if PM is also a developer
                if (!options.find((opt) => opt.value === d.id)) {
                    options.push({
                        value: d.id,
                        label: `${d.name} (Dev)`,
                    });
                }
            });
        }

        return options;
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

    const togglePasswordVisibility = (id: number) => {
        setVisiblePasswords((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        message.success("Copied to clipboard!");
    };

    // Project Edit Handlers
    const handleEditProject = () => {
        projectForm.setFieldsValue({
            name: project.name,
            url: project.url,
            client_email: project.client_email,
            notes: project.notes,
            health_status: project.health_status,
            security_status: project.security_status,
            manager_id: project.manager_id,
            developer_id: project.developer_id,
            developer_ids: project.developers?.map((d) => d.id) || [],
            project_external_id: project.project_external_id,
            maintenance_id: project.maintenance_id,
            health_check_secret: project.health_check_secret,
        });
        setProjectModalVisible(true);
    };

    const handleUpdateProject = (values: any) => {
        router.put(route("projects.update", project.id), values, {
            onSuccess: () => {
                message.success("Project updated successfully!");
                setProjectModalVisible(false);
                projectForm.resetFields();
            },
            onError: () => {
                message.error("Failed to update project");
            },
        });
    };

    const handleDeleteProject = () => {
        router.delete(route("projects.destroy", project.id), {
            onSuccess: () => {
                message.success("Project deleted successfully!");
            },
            onError: () => {
                message.error("Failed to delete project");
            },
        });
    };

    // Health Monitoring Handlers
    const handleOpenHealthSecretModal = () => {
        healthSecretForm.setFieldsValue({
            health_check_secret: project.health_check_secret || "",
        });
        setHealthSecretModalVisible(true);
    };

    const handleSaveHealthSecret = (values: {
        health_check_secret: string;
    }) => {
        router.put(
            route("projects.update", project.id),
            { health_check_secret: values.health_check_secret },
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success("Health monitoring secret saved!");
                    setHealthSecretModalVisible(false);
                    healthSecretForm.resetFields();
                },
                onError: () => {
                    message.error("Failed to save health monitoring secret");
                },
            }
        );
    };

    const handleCheckHealth = async () => {
        if (!project.health_check_secret) {
            message.warning(
                "Please configure the health monitoring secret first"
            );
            return;
        }

        setHealthCheckLoading(true);
        try {
            const response = await axios.post(
                route("projects.check-health", project.id)
            );
            if (response.data.success) {
                message.success("Health check completed!");
                // Refresh the page to show new data
                router.reload({ only: ["project"] });
            } else {
                message.error(response.data.message || "Health check failed");
            }
        } catch (error: any) {
            message.error(
                error.response?.data?.message ||
                    "Failed to perform health check"
            );
        } finally {
            setHealthCheckLoading(false);
        }
    };

    // Credential Handlers
    const handleAddCredential = () => {
        setEditingCredential(null);
        setCredentialType("wordpress");
        credentialForm.resetFields();
        credentialForm.setFieldsValue({ type: "wordpress" });
        setCredentialModalVisible(true);
    };

    const handleEditCredential = (credential: Credential) => {
        setEditingCredential(credential);
        setCredentialType(credential.type);
        credentialForm.setFieldsValue({
            ...credential,
            hostname: credential.metadata?.hostname,
            port: credential.metadata?.port,
            host: credential.metadata?.host,
            database_name: credential.metadata?.database_name,
        });
        setCredentialModalVisible(true);
    };

    const handleSaveCredential = (values: any) => {
        // Build metadata based on type
        const metadata: CredentialMetadata = {};
        if (values.type === "ssh" || values.type === "ftp") {
            if (values.hostname) metadata.hostname = values.hostname;
            if (values.port) metadata.port = values.port;
        } else if (values.type === "database") {
            if (values.host) metadata.host = values.host;
            if (values.port) metadata.port = values.port;
            if (values.database_name)
                metadata.database_name = values.database_name;
        }

        const data = {
            title: values.title,
            type: values.type,
            username: values.username,
            password: values.password,
            url: values.url,
            metadata: Object.keys(metadata).length > 0 ? metadata : null,
        };

        if (editingCredential) {
            router.put(
                route("credentials.update", [project.id, editingCredential.id]),
                data,
                {
                    onSuccess: () => {
                        message.success("Credential updated successfully!");
                        setCredentialModalVisible(false);
                        credentialForm.resetFields();
                    },
                    onError: () => {
                        message.error("Failed to update credential");
                    },
                }
            );
        } else {
            router.post(route("credentials.store", project.id), data, {
                onSuccess: () => {
                    message.success("Credential added successfully!");
                    setCredentialModalVisible(false);
                    credentialForm.resetFields();
                },
                onError: () => {
                    message.error("Failed to add credential");
                },
            });
        }
    };

    const handleDeleteCredential = (id: number) => {
        router.delete(route("credentials.destroy", [project.id, id]), {
            onSuccess: () => {
                message.success("Credential deleted successfully!");
            },
            onError: () => {
                message.error("Failed to delete credential");
            },
        });
    };

    // Share credential handlers
    const handleOpenShareModal = (credential: Credential) => {
        setSharingCredential(credential);
        setGeneratedShareUrl(null);
        shareForm.resetFields();
        shareForm.setFieldsValue({
            expires_in: "24h",
            max_views: 1,
            show_username: true,
            show_password: true,
            show_url: true,
        });
        setShareModalVisible(true);
    };

    const handleCreateShareLink = async (values: any) => {
        if (!sharingCredential) return;

        setShareLoading(true);
        try {
            const response = await axios.post(
                `/credentials/${sharingCredential.id}/share`,
                values
            );
            setGeneratedShareUrl(response.data.share_url);
            message.success("Share link created successfully!");
        } catch (error: any) {
            message.error(
                error.response?.data?.message || "Failed to create share link"
            );
        } finally {
            setShareLoading(false);
        }
    };

    const copyShareUrl = () => {
        if (generatedShareUrl) {
            navigator.clipboard.writeText(generatedShareUrl);
            message.success("Share link copied to clipboard!");
        }
    };

    // Todo Handlers
    const handleAddTodo = () => {
        setEditingTodo(null);
        setTodoFileList([]);
        todoForm.resetFields();
        setTodoModalVisible(true);
    };

    const handleEditTodo = (todo: Todo) => {
        setEditingTodo(todo);
        setTodoFileList([]);
        todoForm.setFieldsValue({
            ...todo,
            due_date: todo.due_date ? dayjs(todo.due_date) : null,
        });
        setTodoModalVisible(true);
    };

    const handleViewTodo = (todo: Todo) => {
        setViewingTodo(todo);
        setTodoViewModalVisible(true);
    };

    const handleSaveTodo = (values: any) => {
        const formData = new FormData();
        formData.append("title", values.title);
        formData.append("description", values.description || "");
        formData.append("priority", values.priority?.toString() || "0");
        formData.append("completed", values.completed ? "1" : "0");
        if (values.due_date) {
            formData.append("due_date", values.due_date.format("YYYY-MM-DD"));
        }
        // Add assignee if selected
        if (values.assignee_id) {
            formData.append("assignee_id", values.assignee_id.toString());
        }

        // Add file if selected
        if (todoFileList.length > 0 && todoFileList[0].originFileObj) {
            formData.append("file", todoFileList[0].originFileObj);
        }

        // Handle file removal
        if (values.remove_file) {
            formData.append("remove_file", "1");
        }

        if (editingTodo) {
            formData.append("_method", "PUT");
            router.post(
                route("todos.update", [project.id, editingTodo.id]),
                formData,
                {
                    forceFormData: true,
                    onSuccess: () => {
                        message.success("Todo updated successfully!");
                        setTodoModalVisible(false);
                        todoForm.resetFields();
                        setTodoFileList([]);
                    },
                    onError: () => {
                        message.error("Failed to update todo");
                    },
                }
            );
        } else {
            router.post(route("todos.store", project.id), formData, {
                forceFormData: true,
                onSuccess: () => {
                    message.success("Todo added successfully!");
                    setTodoModalVisible(false);
                    todoForm.resetFields();
                    setTodoFileList([]);
                },
                onError: () => {
                    message.error("Failed to add todo");
                },
            });
        }
    };

    const handleToggleTodoComplete = (todo: Todo) => {
        router.put(
            route("todos.update", [project.id, todo.id]),
            {
                completed: !todo.completed,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success("Todo updated!");
                },
                onError: () => {
                    message.error("Failed to update todo");
                },
            }
        );
    };

    const handleDeleteTodo = (id: number) => {
        router.delete(route("todos.destroy", [project.id, id]), {
            onSuccess: () => {
                message.success("Todo deleted successfully!");
            },
            onError: () => {
                message.error("Failed to delete todo");
            },
        });
    };

    // Resource Handlers
    const handleAddResource = () => {
        setEditingResource(null);
        setResourceType("link");
        setFileList([]);
        resourceForm.resetFields();
        resourceForm.setFieldsValue({ type: "link" });
        setResourceModalVisible(true);
    };

    const handleEditResource = (resource: Resource) => {
        setEditingResource(resource);
        setResourceType(resource.type);
        setFileList([]);
        resourceForm.setFieldsValue({
            title: resource.title,
            type: resource.type,
            url: resource.url,
            notes: resource.notes,
        });
        setResourceModalVisible(true);
    };

    const handleSaveResource = (values: any) => {
        const formData = new FormData();
        formData.append("title", values.title);
        formData.append("type", values.type);
        formData.append("notes", values.notes || "");

        if (values.type === "link") {
            formData.append("url", values.url || "");
        } else if (fileList.length > 0) {
            formData.append("file", fileList[0].originFileObj);
        }

        if (editingResource) {
            formData.append("_method", "PUT");
            router.post(
                route("resources.update", [project.id, editingResource.id]),
                formData,
                {
                    forceFormData: true,
                    onSuccess: () => {
                        message.success("Resource updated successfully!");
                        setResourceModalVisible(false);
                        resourceForm.resetFields();
                        setFileList([]);
                    },
                    onError: () => {
                        message.error("Failed to update resource");
                    },
                }
            );
        } else {
            router.post(route("resources.store", project.id), formData, {
                forceFormData: true,
                onSuccess: () => {
                    message.success("Resource added successfully!");
                    setResourceModalVisible(false);
                    resourceForm.resetFields();
                    setFileList([]);
                },
                onError: () => {
                    message.error("Failed to add resource");
                },
            });
        }
    };

    const handleDeleteResource = (id: number) => {
        router.delete(route("resources.destroy", [project.id, id]), {
            onSuccess: () => {
                message.success("Resource deleted successfully!");
            },
            onError: () => {
                message.error("Failed to delete resource");
            },
        });
    };

    const formatFileSize = (bytes: number) => {
        if (!bytes) return "-";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

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

    const getPriorityColor = (priority: number) => {
        switch (priority) {
            case 2:
                return "error";
            case 1:
                return "warning";
            default:
                return "default";
        }
    };

    const getPriorityText = (priority: number) => {
        switch (priority) {
            case 2:
                return "Urgent";
            case 1:
                return "High";
            default:
                return "Normal";
        }
    };

    const getCredentialTypeIcon = (type: string) => {
        switch (type) {
            case "ssh":
                return <CloudServerOutlined />;
            case "ftp":
                return <CloudServerOutlined />;
            case "database":
                return <DatabaseOutlined />;
            case "wordpress":
                return <GlobalOutlined />;
            case "hosting":
                return <CloudServerOutlined />;
            case "email":
                return <MailOutlined />;
            case "api":
                return <ApiOutlined />;
            default:
                return <KeyOutlined />;
        }
    };

    const getCredentialTypeColor = (type: string) => {
        switch (type) {
            case "ssh":
                return "cyan";
            case "ftp":
                return "blue";
            case "database":
                return "orange";
            case "wordpress":
                return "purple";
            case "hosting":
                return "green";
            case "email":
                return "magenta";
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

    const credentialColumns = [
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            render: (type: string) => (
                <Tag
                    icon={getCredentialTypeIcon(type)}
                    color={getCredentialTypeColor(type)}
                >
                    {type.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Username",
            dataIndex: "username",
            key: "username",
            render: (username: string) =>
                username ? (
                    <Space>
                        <span>{username}</span>
                        <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => copyToClipboard(username)}
                        />
                    </Space>
                ) : (
                    "-"
                ),
        },
        {
            title: "Password",
            dataIndex: "password",
            key: "password",
            render: (password: string, record: Credential) =>
                password ? (
                    <Space>
                        <span style={{ fontFamily: "monospace" }}>
                            {visiblePasswords[record.id]
                                ? password
                                : "••••••••••"}
                        </span>
                        <Button
                            type="text"
                            size="small"
                            icon={
                                visiblePasswords[record.id] ? (
                                    <EyeInvisibleOutlined />
                                ) : (
                                    <EyeOutlined />
                                )
                            }
                            onClick={() => togglePasswordVisibility(record.id)}
                        />
                        <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => copyToClipboard(password)}
                        />
                    </Space>
                ) : (
                    "-"
                ),
        },
        {
            title: "URL",
            dataIndex: "url",
            key: "url",
            render: (url: string) =>
                url && (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                        <Button type="link" size="small">
                            Open
                        </Button>
                    </a>
                ),
        },
        {
            title: "Details",
            key: "metadata",
            render: (_: any, record: Credential) =>
                renderMetadataPopover(record),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: Credential) => (
                <Space>
                    <Tooltip title="Share credential">
                        <Button
                            type="text"
                            size="small"
                            icon={<ShareAltOutlined />}
                            onClick={() => handleOpenShareModal(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEditCredential(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Are you sure to delete this credential?"
                        onConfirm={() => handleDeleteCredential(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete">
                            <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const resourceColumns = [
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            render: (type: string) => (
                <Tag
                    icon={type === "link" ? <LinkOutlined /> : <FileOutlined />}
                    color={type === "link" ? "blue" : "green"}
                >
                    {type.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Details",
            key: "details",
            render: (_: any, record: Resource) =>
                record.type === "link" ? (
                    <a
                        href={record.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#6c1e9f" }}
                    >
                        <LinkOutlined /> Open Link
                    </a>
                ) : (
                    <Space direction="vertical" size={0}>
                        <span>{record.file_name}</span>
                        <span style={{ color: "#888", fontSize: 12 }}>
                            {formatFileSize(record.file_size)}
                        </span>
                    </Space>
                ),
        },
        {
            title: "Notes",
            dataIndex: "notes",
            key: "notes",
            ellipsis: true,
            render: (notes: string) => notes || "-",
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: Resource) => (
                <Space>
                    {record.type === "file" && record.file_path && (
                        <a
                            href={route("resources.download", [
                                project.id,
                                record.id,
                            ])}
                            download
                        >
                            <Button
                                type="text"
                                size="small"
                                icon={<DownloadOutlined />}
                            />
                        </a>
                    )}
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditResource(record)}
                    />
                    <Popconfirm
                        title="Are you sure to delete this resource?"
                        onConfirm={() => handleDeleteResource(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const todoColumns = [
        {
            title: "Status",
            key: "completed",
            width: 80,
            render: (_: any, record: Todo) => (
                <Checkbox
                    checked={record.completed}
                    onChange={() => handleToggleTodoComplete(record)}
                />
            ),
        },
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            render: (title: string, record: Todo) => (
                <Space>
                    <span
                        style={{
                            textDecoration: record.completed
                                ? "line-through"
                                : "none",
                        }}
                    >
                        {title}
                    </span>
                    {record.file_name && (
                        <Tooltip title={`Attachment: ${record.file_name}`}>
                            <PaperClipOutlined style={{ color: "#6c1e9f" }} />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
        {
            title: "Priority",
            dataIndex: "priority",
            key: "priority",
            render: (priority: number) => (
                <Tag color={getPriorityColor(priority)}>
                    {getPriorityText(priority)}
                </Tag>
            ),
        },
        {
            title: "Due Date",
            dataIndex: "due_date",
            key: "due_date",
            render: (date: string) =>
                date ? dayjs(date).format("MMM DD, YYYY") : "-",
        },
        {
            title: "Assignee",
            key: "assignee",
            width: 180,
            render: (_: any, record: Todo) => {
                const canEdit = isAdmin || isManager;

                if (canEdit) {
                    return (
                        <Spin
                            spinning={updatingTodoId === record.id}
                            size="small"
                        >
                            <Select
                                size="small"
                                style={{ width: 160 }}
                                placeholder="Unassigned"
                                allowClear
                                value={record.assignee?.id || undefined}
                                onChange={(value) =>
                                    handleInlineAssigneeChange(
                                        record.id,
                                        value || null
                                    )
                                }
                                options={getAssigneeOptions()}
                                disabled={updatingTodoId === record.id}
                            />
                        </Spin>
                    );
                }

                return record.assignee ? (
                    <Tag
                        style={{
                            background:
                                "linear-gradient(135deg, #1890ff 0%, #69c0ff 100%)",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                        }}
                    >
                        {record.assignee.name}
                    </Tag>
                ) : (
                    <span style={{ color: "#999" }}>Unassigned</span>
                );
            },
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: Todo) => (
                <Space>
                    <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewTodo(record)}
                    />
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditTodo(record)}
                    />
                    <Popconfirm
                        title="Are you sure to delete this todo?"
                        onConfirm={() => handleDeleteTodo(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <AuthenticatedLayout header={project.name}>
            <Head title={project.name} />

            <Space direction="vertical" size="large" style={{ width: "100%" }}>
                {/* Project Header */}
                <Card
                    className="project-header-card"
                    style={{
                        borderRadius: 16,
                        overflow: "hidden",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(108, 30, 159, 0.08)",
                    }}
                    styles={{
                        header: {
                            background:
                                "linear-gradient(135deg, #6c1e9f 0%, #9b4dca 100%)",
                            borderBottom: "none",
                            padding: "20px 24px",
                        },
                        body: {
                            padding: "24px",
                        },
                    }}
                    title={
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    background: "rgba(255,255,255,0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 20,
                                    color: "#fff",
                                }}
                            >
                                <GlobalOutlined />
                            </div>
                            <div>
                                <div
                                    style={{
                                        color: "#fff",
                                        fontSize: 18,
                                        fontWeight: 600,
                                    }}
                                >
                                    {project.name}
                                </div>
                                <div
                                    style={{
                                        color: "rgba(255,255,255,0.8)",
                                        fontSize: 13,
                                    }}
                                >
                                    {project.url}
                                </div>
                            </div>
                        </div>
                    }
                    extra={
                        <Space>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={handleEditProject}
                                style={{
                                    background: "rgba(255,255,255,0.2)",
                                    border: "none",
                                    boxShadow: "none",
                                }}
                            >
                                Edit Project
                            </Button>
                            <Popconfirm
                                title="Are you sure to delete this project?"
                                description="This will delete all associated credentials, resources, and todos."
                                onConfirm={handleDeleteProject}
                                okText="Yes"
                                cancelText="No"
                                okButtonProps={{ danger: true }}
                            >
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    style={{
                                        background: "rgba(255,77,79,0.2)",
                                        border: "none",
                                        color: "#fff",
                                    }}
                                >
                                    Delete
                                </Button>
                            </Popconfirm>
                        </Space>
                    }
                >
                    {/* Status Tags Row */}
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 12,
                            marginBottom: 24,
                            padding: "16px 20px",
                            background:
                                "linear-gradient(135deg, rgba(108, 30, 159, 0.04) 0%, rgba(155, 77, 202, 0.04) 100%)",
                            borderRadius: 12,
                        }}
                    >
                        {project.project_external_id && (
                            <Tag
                                style={{
                                    fontFamily: "monospace",
                                    fontSize: 13,
                                    padding: "6px 12px",
                                    borderRadius: 8,
                                    background:
                                        "linear-gradient(135deg, #1890ff 0%, #69c0ff 100%)",
                                    border: "none",
                                    color: "#fff",
                                }}
                            >
                                Project ID: {project.project_external_id}
                            </Tag>
                        )}
                        {project.maintenance_id && (
                            <Tag
                                style={{
                                    fontFamily: "monospace",
                                    fontSize: 13,
                                    padding: "6px 12px",
                                    borderRadius: 8,
                                    background:
                                        "linear-gradient(135deg, #6c1e9f 0%, #9b4dca 100%)",
                                    border: "none",
                                    color: "#fff",
                                }}
                            >
                                Maintenance: {project.maintenance_id}
                            </Tag>
                        )}
                        <Tag
                            icon={getHealthIcon(project.health_status)}
                            style={{
                                fontSize: 13,
                                padding: "6px 12px",
                                borderRadius: 8,
                                background:
                                    project.health_status === "online"
                                        ? "linear-gradient(135deg, #52c41a 0%, #95de64 100%)"
                                        : project.health_status === "issues"
                                        ? "linear-gradient(135deg, #faad14 0%, #ffc53d 100%)"
                                        : "linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)",
                                border: "none",
                                color: "#fff",
                            }}
                        >
                            {project.health_status
                                .replace("_", " ")
                                .toUpperCase()}
                        </Tag>
                        <Tag
                            icon={getSecurityIcon(project.security_status)}
                            style={{
                                fontSize: 13,
                                padding: "6px 12px",
                                borderRadius: 8,
                                background:
                                    project.security_status === "secure"
                                        ? "linear-gradient(135deg, #52c41a 0%, #95de64 100%)"
                                        : project.security_status ===
                                          "monitoring"
                                        ? "linear-gradient(135deg, #faad14 0%, #ffc53d 100%)"
                                        : "linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)",
                                border: "none",
                                color: "#fff",
                            }}
                        >
                            {project.security_status.toUpperCase()}
                        </Tag>
                    </div>

                    {/* Info Grid */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: 16,
                        }}
                    >
                        <div
                            style={{
                                padding: 16,
                                background: "#fafafa",
                                borderRadius: 12,
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background:
                                        "linear-gradient(135deg, #6c1e9f 0%, #9b4dca 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#fff",
                                }}
                            >
                                <GlobalOutlined />
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Website URL
                                </Text>
                                <div>
                                    <a
                                        href={project.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            color: "#6c1e9f",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {project.url}
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                padding: 16,
                                background: "#fafafa",
                                borderRadius: 12,
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background:
                                        "linear-gradient(135deg, #e46a28 0%, #ff8c4a 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#fff",
                                }}
                            >
                                <MailOutlined />
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Client Email
                                </Text>
                                <div>
                                    <a
                                        href={`mailto:${project.client_email}`}
                                        style={{
                                            color: "#6c1e9f",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {project.client_email}
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                padding: 16,
                                background: "#fafafa",
                                borderRadius: 12,
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background: project.manager
                                        ? "linear-gradient(135deg, #6c1e9f 0%, #9b4dca 100%)"
                                        : "#d9d9d9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#fff",
                                    fontSize: 16,
                                    fontWeight: 600,
                                }}
                            >
                                {project.manager
                                    ? project.manager.name
                                          .charAt(0)
                                          .toUpperCase()
                                    : "?"}
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Project Manager
                                </Text>
                                <div
                                    style={{
                                        fontWeight: 500,
                                        color: "#1f1f1f",
                                    }}
                                >
                                    {project.manager ? (
                                        project.manager.name
                                    ) : (
                                        <span style={{ color: "#999" }}>
                                            Not assigned
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                padding: 16,
                                background: "#fafafa",
                                borderRadius: 12,
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 12,
                            }}
                        >
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background:
                                        project.developers?.length > 0
                                            ? "linear-gradient(135deg, #1890ff 0%, #69c0ff 100%)"
                                            : "#d9d9d9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#fff",
                                    fontSize: 14,
                                    fontWeight: 600,
                                    flexShrink: 0,
                                }}
                            >
                                {project.developers?.length || 0}
                            </div>
                            <div style={{ flex: 1 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Developers
                                </Text>
                                <div
                                    style={{
                                        fontWeight: 500,
                                        color: "#1f1f1f",
                                    }}
                                >
                                    {project.developers?.length > 0 ? (
                                        <div
                                            style={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: 6,
                                                marginTop: 4,
                                            }}
                                        >
                                            {project.developers.map((dev) => (
                                                <Tag
                                                    key={dev.id}
                                                    style={{
                                                        background:
                                                            "linear-gradient(135deg, #1890ff 0%, #69c0ff 100%)",
                                                        color: "#fff",
                                                        border: "none",
                                                        borderRadius: 6,
                                                        margin: 0,
                                                    }}
                                                >
                                                    {dev.name}
                                                </Tag>
                                            ))}
                                        </div>
                                    ) : (
                                        <span style={{ color: "#999" }}>
                                            Not assigned
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Tabs */}
                <Card
                    style={{
                        borderRadius: 16,
                        border: "none",
                        boxShadow: "0 4px 20px rgba(108, 30, 159, 0.08)",
                    }}
                    styles={{
                        body: {
                            padding: "24px",
                        },
                    }}
                >
                    <Tabs
                        defaultActiveKey="overview"
                        type="card"
                        style={{ marginTop: -8 }}
                        items={[
                            {
                                key: "overview",
                                label: "Overview",
                                children: (
                                    <div style={{ paddingTop: 16 }}>
                                        {project.notes ? (
                                            <div>
                                                <Title
                                                    level={5}
                                                    style={{ marginBottom: 12 }}
                                                >
                                                    Notes
                                                </Title>
                                                <Card
                                                    size="small"
                                                    style={{
                                                        backgroundColor:
                                                            "rgba(108, 30, 159, 0.03)",
                                                        border: "1px solid rgba(108, 30, 159, 0.1)",
                                                        borderRadius: 12,
                                                    }}
                                                >
                                                    <Paragraph
                                                        style={{
                                                            whiteSpace:
                                                                "pre-wrap",
                                                            margin: 0,
                                                        }}
                                                    >
                                                        {project.notes}
                                                    </Paragraph>
                                                </Card>
                                            </div>
                                        ) : (
                                            <div
                                                style={{
                                                    textAlign: "center",
                                                    padding: "40px 20px",
                                                    background:
                                                        "rgba(108, 30, 159, 0.02)",
                                                    borderRadius: 12,
                                                }}
                                            >
                                                <InfoCircleOutlined
                                                    style={{
                                                        fontSize: 32,
                                                        color: "#d9d9d9",
                                                        marginBottom: 12,
                                                    }}
                                                />
                                                <Paragraph type="secondary">
                                                    No notes available for this
                                                    project
                                                </Paragraph>
                                            </div>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: "credentials",
                                label: (
                                    <Badge
                                        count={project.credentials.length}
                                        offset={[10, 0]}
                                        size="small"
                                    >
                                        <span>Credentials</span>
                                    </Badge>
                                ),
                                children: (
                                    <div style={{ paddingTop: 16 }}>
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={handleAddCredential}
                                            style={{ marginBottom: 16 }}
                                        >
                                            Add Credential
                                        </Button>
                                        <Table
                                            columns={credentialColumns}
                                            dataSource={project.credentials}
                                            rowKey="id"
                                            pagination={false}
                                            scroll={{ x: 600 }}
                                            className="custom-table"
                                        />
                                    </div>
                                ),
                            },
                            {
                                key: "resources",
                                label: (
                                    <Badge
                                        count={project.resources.length}
                                        offset={[10, 0]}
                                        size="small"
                                    >
                                        <span>Resources</span>
                                    </Badge>
                                ),
                                children: (
                                    <div style={{ paddingTop: 16 }}>
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={handleAddResource}
                                            style={{ marginBottom: 16 }}
                                        >
                                            Add Resource
                                        </Button>
                                        <Table
                                            columns={resourceColumns}
                                            dataSource={project.resources}
                                            rowKey="id"
                                            pagination={false}
                                            scroll={{ x: 500 }}
                                            className="custom-table"
                                        />
                                    </div>
                                ),
                            },
                            {
                                key: "todos",
                                label: (
                                    <Badge
                                        count={project.todos?.length || 0}
                                        offset={[10, 0]}
                                        size="small"
                                    >
                                        <span>Todos</span>
                                    </Badge>
                                ),
                                children: (
                                    <div style={{ paddingTop: 16 }}>
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={handleAddTodo}
                                            style={{ marginBottom: 16 }}
                                        >
                                            Add Todo
                                        </Button>
                                        <Table
                                            columns={todoColumns}
                                            dataSource={project.todos || []}
                                            rowKey="id"
                                            pagination={false}
                                            scroll={{ x: 600 }}
                                            className="custom-table"
                                        />
                                    </div>
                                ),
                            },
                            {
                                key: "health",
                                label: (
                                    <span>
                                        <SafetyOutlined /> Health Monitor
                                    </span>
                                ),
                                children: (
                                    <div style={{ paddingTop: 16 }}>
                                        {/* Health Check Configuration */}
                                        <Card
                                            size="small"
                                            title={
                                                <Space>
                                                    <SettingOutlined />
                                                    <span>
                                                        WordPress Health
                                                        Monitoring
                                                    </span>
                                                </Space>
                                            }
                                            extra={
                                                <Space>
                                                    <Button
                                                        size="small"
                                                        icon={<EditOutlined />}
                                                        onClick={
                                                            handleOpenHealthSecretModal
                                                        }
                                                    >
                                                        {project.health_check_secret
                                                            ? "Edit Secret"
                                                            : "Add Secret Key"}
                                                    </Button>
                                                    {project.health_check_secret && (
                                                        <Button
                                                            size="small"
                                                            type="primary"
                                                            icon={
                                                                <SyncOutlined
                                                                    spin={
                                                                        healthCheckLoading
                                                                    }
                                                                />
                                                            }
                                                            onClick={
                                                                handleCheckHealth
                                                            }
                                                            loading={
                                                                healthCheckLoading
                                                            }
                                                        >
                                                            Check Now
                                                        </Button>
                                                    )}
                                                </Space>
                                            }
                                            style={{ marginBottom: 16 }}
                                        >
                                            {project.health_check_secret ? (
                                                <Space
                                                    direction="vertical"
                                                    style={{ width: "100%" }}
                                                >
                                                    <Tag color="success">
                                                        <CheckCircleOutlined />{" "}
                                                        Connected
                                                    </Tag>
                                                    <Text type="secondary">
                                                        Secret Key:{" "}
                                                        <Text code copyable>
                                                            {project.health_check_secret.substring(
                                                                0,
                                                                8
                                                            )}
                                                            ...
                                                        </Text>
                                                    </Text>
                                                    {project.last_health_check_at && (
                                                        <Text type="secondary">
                                                            Last check:{" "}
                                                            {dayjs(
                                                                project.last_health_check_at
                                                            ).format(
                                                                "DD.MM.YYYY HH:mm"
                                                            )}
                                                        </Text>
                                                    )}
                                                </Space>
                                            ) : (
                                                <Space direction="vertical">
                                                    <Tag color="warning">
                                                        <WarningOutlined /> Not
                                                        Configured
                                                    </Tag>
                                                    <Text type="secondary">
                                                        Install the LSM Health
                                                        Monitor plugin on this
                                                        WordPress site, then
                                                        click "Add Secret Key"
                                                        to connect.
                                                    </Text>
                                                </Space>
                                            )}
                                        </Card>

                                        {/* Health Details */}
                                        {project.last_health_details ? (
                                            project.last_health_details
                                                .error ? (
                                                /* Error State */
                                                <div
                                                    style={{
                                                        textAlign: "center",
                                                        padding: "40px 20px",
                                                        background:
                                                            "rgba(255, 77, 79, 0.05)",
                                                        borderRadius: 12,
                                                        border: "1px solid rgba(255, 77, 79, 0.2)",
                                                    }}
                                                >
                                                    <CloseCircleOutlined
                                                        style={{
                                                            fontSize: 48,
                                                            color: "#ff4d4f",
                                                            marginBottom: 16,
                                                        }}
                                                    />
                                                    <Title
                                                        level={4}
                                                        type="danger"
                                                        style={{
                                                            marginBottom: 8,
                                                        }}
                                                    >
                                                        Health Check Failed
                                                    </Title>
                                                    <Paragraph type="secondary">
                                                        <Text strong>
                                                            Error Type:{" "}
                                                        </Text>
                                                        {project
                                                            .last_health_details
                                                            .error_type ===
                                                        "http_error"
                                                            ? `HTTP Error ${project.last_health_details.error_code}`
                                                            : "Connection Error"}
                                                    </Paragraph>
                                                    <Paragraph
                                                        type="secondary"
                                                        style={{
                                                            marginBottom: 16,
                                                        }}
                                                    >
                                                        <Text strong>
                                                            Details:{" "}
                                                        </Text>
                                                        {
                                                            project
                                                                .last_health_details
                                                                .error_message
                                                        }
                                                    </Paragraph>
                                                    {project.last_health_details
                                                        .checked_at && (
                                                        <Text
                                                            type="secondary"
                                                            style={{
                                                                fontSize: 12,
                                                            }}
                                                        >
                                                            Last attempt:{" "}
                                                            {dayjs(
                                                                project
                                                                    .last_health_details
                                                                    .checked_at
                                                            ).format(
                                                                "DD.MM.YYYY HH:mm"
                                                            )}
                                                        </Text>
                                                    )}
                                                    <div
                                                        style={{
                                                            marginTop: 16,
                                                        }}
                                                    >
                                                        <Button
                                                            type="primary"
                                                            icon={
                                                                <SyncOutlined />
                                                            }
                                                            onClick={
                                                                handleCheckHealth
                                                            }
                                                            loading={
                                                                healthCheckLoading
                                                            }
                                                        >
                                                            Retry Health Check
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Row gutter={[16, 16]}>
                                                    {/* WordPress Info */}
                                                    <Col xs={24} sm={12} lg={8}>
                                                        <Card
                                                            size="small"
                                                            title="WordPress"
                                                        >
                                                            <Space direction="vertical">
                                                                <div>
                                                                    <Text type="secondary">
                                                                        Version:
                                                                    </Text>{" "}
                                                                    <Text
                                                                        strong
                                                                    >
                                                                        {project
                                                                            .last_health_details
                                                                            .wordpress
                                                                            ?.version ||
                                                                            project.wp_version ||
                                                                            "N/A"}
                                                                    </Text>
                                                                    {project
                                                                        .last_health_details
                                                                        .updates
                                                                        ?.core_update_available && (
                                                                        <Tag
                                                                            color="orange"
                                                                            style={{
                                                                                marginLeft: 8,
                                                                            }}
                                                                        >
                                                                            Update
                                                                            available
                                                                        </Tag>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <Text type="secondary">
                                                                        PHP:
                                                                    </Text>{" "}
                                                                    <Text>
                                                                        {project
                                                                            .last_health_details
                                                                            .php
                                                                            ?.version ||
                                                                            project.php_version ||
                                                                            "N/A"}
                                                                    </Text>
                                                                </div>
                                                            </Space>
                                                        </Card>
                                                    </Col>

                                                    {/* Plugins */}
                                                    <Col xs={24} sm={12} lg={8}>
                                                        <Card
                                                            size="small"
                                                            title="Plugins"
                                                        >
                                                            <Space direction="vertical">
                                                                <div>
                                                                    <Text type="secondary">
                                                                        Total:
                                                                    </Text>{" "}
                                                                    <Text>
                                                                        {project
                                                                            .last_health_details
                                                                            .plugins
                                                                            ?.total_count ||
                                                                            0}
                                                                    </Text>
                                                                </div>
                                                                <div>
                                                                    <Text type="secondary">
                                                                        Active:
                                                                    </Text>{" "}
                                                                    <Text>
                                                                        {project
                                                                            .last_health_details
                                                                            .plugins
                                                                            ?.active_count ||
                                                                            0}
                                                                    </Text>
                                                                </div>
                                                                <div>
                                                                    <Text type="secondary">
                                                                        Outdated:
                                                                    </Text>{" "}
                                                                    <Text
                                                                        type={
                                                                            (project
                                                                                .last_health_details
                                                                                .plugins
                                                                                ?.outdated_count ||
                                                                                0) >
                                                                            0
                                                                                ? "danger"
                                                                                : undefined
                                                                        }
                                                                        strong={
                                                                            (project
                                                                                .last_health_details
                                                                                .plugins
                                                                                ?.outdated_count ||
                                                                                0) >
                                                                            0
                                                                        }
                                                                    >
                                                                        {project
                                                                            .last_health_details
                                                                            .plugins
                                                                            ?.outdated_count ||
                                                                            0}
                                                                    </Text>
                                                                </div>
                                                            </Space>
                                                        </Card>
                                                    </Col>

                                                    {/* Security */}
                                                    <Col xs={24} sm={12} lg={8}>
                                                        <Card
                                                            size="small"
                                                            title="Security"
                                                        >
                                                            <Space direction="vertical">
                                                                <div>
                                                                    <Text type="secondary">
                                                                        SSL:
                                                                    </Text>{" "}
                                                                    {project
                                                                        .last_health_details
                                                                        .ssl
                                                                        ?.enabled ? (
                                                                        <Tag color="success">
                                                                            Enabled
                                                                        </Tag>
                                                                    ) : (
                                                                        <Tag color="error">
                                                                            Disabled
                                                                        </Tag>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <Text type="secondary">
                                                                        Debug
                                                                        Mode:
                                                                    </Text>{" "}
                                                                    {project
                                                                        .last_health_details
                                                                        .security
                                                                        ?.debug_mode ? (
                                                                        <Tag color="warning">
                                                                            On
                                                                        </Tag>
                                                                    ) : (
                                                                        <Tag color="success">
                                                                            Off
                                                                        </Tag>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <Text type="secondary">
                                                                        File
                                                                        Edit:
                                                                    </Text>{" "}
                                                                    {project
                                                                        .last_health_details
                                                                        .security
                                                                        ?.file_editing_disabled ? (
                                                                        <Tag color="success">
                                                                            Disabled
                                                                        </Tag>
                                                                    ) : (
                                                                        <Tag color="warning">
                                                                            Enabled
                                                                        </Tag>
                                                                    )}
                                                                </div>
                                                            </Space>
                                                        </Card>
                                                    </Col>

                                                    {/* Theme */}
                                                    <Col xs={24} sm={12} lg={8}>
                                                        <Card
                                                            size="small"
                                                            title="Theme"
                                                        >
                                                            <Space direction="vertical">
                                                                <div>
                                                                    <Text type="secondary">
                                                                        Name:
                                                                    </Text>{" "}
                                                                    <Text>
                                                                        {project
                                                                            .last_health_details
                                                                            .theme
                                                                            ?.name ||
                                                                            "N/A"}
                                                                    </Text>
                                                                </div>
                                                                <div>
                                                                    <Text type="secondary">
                                                                        Version:
                                                                    </Text>{" "}
                                                                    <Text>
                                                                        {project
                                                                            .last_health_details
                                                                            .theme
                                                                            ?.version ||
                                                                            "N/A"}
                                                                    </Text>
                                                                    {project
                                                                        .last_health_details
                                                                        .theme
                                                                        ?.update_available && (
                                                                        <Tag
                                                                            color="orange"
                                                                            style={{
                                                                                marginLeft: 8,
                                                                            }}
                                                                        >
                                                                            Update
                                                                        </Tag>
                                                                    )}
                                                                </div>
                                                            </Space>
                                                        </Card>
                                                    </Col>

                                                    {/* Landeseiten Stack */}
                                                    {project.last_health_details
                                                        .landeseiten_stack && (
                                                        <Col
                                                            xs={24}
                                                            sm={12}
                                                            lg={8}
                                                        >
                                                            <Card
                                                                size="small"
                                                                title={
                                                                    <Space>
                                                                        <span>
                                                                            Landeseiten
                                                                            Stack
                                                                        </span>
                                                                        {project
                                                                            .last_health_details
                                                                            .landeseiten_stack
                                                                            .stack_complete ? (
                                                                            <Tag color="success">
                                                                                Complete
                                                                            </Tag>
                                                                        ) : (
                                                                            <Tag color="warning">
                                                                                Incomplete
                                                                            </Tag>
                                                                        )}
                                                                    </Space>
                                                                }
                                                            >
                                                                <Space
                                                                    direction="vertical"
                                                                    style={{
                                                                        width: "100%",
                                                                    }}
                                                                >
                                                                    <div>
                                                                        {project
                                                                            .last_health_details
                                                                            .landeseiten_stack
                                                                            .hello_elementor
                                                                            .active ? (
                                                                            <Tag
                                                                                color="success"
                                                                                icon={
                                                                                    <CheckCircleOutlined />
                                                                                }
                                                                            >
                                                                                Hello
                                                                                Elementor{" "}
                                                                                {
                                                                                    project
                                                                                        .last_health_details
                                                                                        .landeseiten_stack
                                                                                        .hello_elementor
                                                                                        .version
                                                                                }
                                                                            </Tag>
                                                                        ) : (
                                                                            <Tag
                                                                                color="error"
                                                                                icon={
                                                                                    <CloseCircleOutlined />
                                                                                }
                                                                            >
                                                                                Hello
                                                                                Elementor
                                                                                Missing
                                                                            </Tag>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        {project
                                                                            .last_health_details
                                                                            .landeseiten_stack
                                                                            .child_theme
                                                                            .active ? (
                                                                            <Tag
                                                                                color="success"
                                                                                icon={
                                                                                    <CheckCircleOutlined />
                                                                                }
                                                                            >
                                                                                {project
                                                                                    .last_health_details
                                                                                    .landeseiten_stack
                                                                                    .child_theme
                                                                                    .name ||
                                                                                    "Child Theme"}{" "}
                                                                                {
                                                                                    project
                                                                                        .last_health_details
                                                                                        .landeseiten_stack
                                                                                        .child_theme
                                                                                        .version
                                                                                }
                                                                            </Tag>
                                                                        ) : (
                                                                            <Tag
                                                                                color="error"
                                                                                icon={
                                                                                    <CloseCircleOutlined />
                                                                                }
                                                                            >
                                                                                LS
                                                                                Child
                                                                                Theme
                                                                                Missing
                                                                            </Tag>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        {project
                                                                            .last_health_details
                                                                            .landeseiten_stack
                                                                            .gravity_plugin
                                                                            .active ? (
                                                                            <Tag
                                                                                color="success"
                                                                                icon={
                                                                                    <CheckCircleOutlined />
                                                                                }
                                                                            >
                                                                                LS
                                                                                Gravity{" "}
                                                                                {
                                                                                    project
                                                                                        .last_health_details
                                                                                        .landeseiten_stack
                                                                                        .gravity_plugin
                                                                                        .version
                                                                                }
                                                                            </Tag>
                                                                        ) : (
                                                                            <Tag
                                                                                color="error"
                                                                                icon={
                                                                                    <CloseCircleOutlined />
                                                                                }
                                                                            >
                                                                                LS
                                                                                Gravity
                                                                                Missing
                                                                            </Tag>
                                                                        )}
                                                                    </div>
                                                                </Space>
                                                            </Card>
                                                        </Col>
                                                    )}

                                                    {/* Performance */}
                                                    <Col xs={24} sm={12} lg={8}>
                                                        <Card
                                                            size="small"
                                                            title="Performance"
                                                        >
                                                            <Space direction="vertical">
                                                                {project.response_time_ms && (
                                                                    <div>
                                                                        <Text type="secondary">
                                                                            Response
                                                                            Time:
                                                                        </Text>{" "}
                                                                        <Text>
                                                                            {
                                                                                project.response_time_ms
                                                                            }
                                                                            ms
                                                                        </Text>
                                                                    </div>
                                                                )}
                                                                {project
                                                                    .last_health_details
                                                                    .performance
                                                                    ?.memory_usage && (
                                                                    <div>
                                                                        <Text type="secondary">
                                                                            Memory:
                                                                        </Text>{" "}
                                                                        <Text>
                                                                            {
                                                                                project
                                                                                    .last_health_details
                                                                                    .performance
                                                                                    .memory_usage
                                                                            }
                                                                        </Text>
                                                                    </div>
                                                                )}
                                                            </Space>
                                                        </Card>
                                                    </Col>

                                                    {/* Disk */}
                                                    {project.last_health_details
                                                        .disk && (
                                                        <Col
                                                            xs={24}
                                                            sm={12}
                                                            lg={8}
                                                        >
                                                            <Card
                                                                size="small"
                                                                title="Disk Space"
                                                            >
                                                                <Space direction="vertical">
                                                                    {project
                                                                        .last_health_details
                                                                        .disk
                                                                        ?.free_space && (
                                                                        <div>
                                                                            <Text type="secondary">
                                                                                Free:
                                                                            </Text>{" "}
                                                                            <Text>
                                                                                {
                                                                                    project
                                                                                        .last_health_details
                                                                                        .disk
                                                                                        .free_space
                                                                                }
                                                                            </Text>
                                                                        </div>
                                                                    )}
                                                                    {project
                                                                        .last_health_details
                                                                        .disk
                                                                        ?.total_space && (
                                                                        <div>
                                                                            <Text type="secondary">
                                                                                Total:
                                                                            </Text>{" "}
                                                                            <Text>
                                                                                {
                                                                                    project
                                                                                        .last_health_details
                                                                                        .disk
                                                                                        .total_space
                                                                                }
                                                                            </Text>
                                                                        </div>
                                                                    )}
                                                                </Space>
                                                            </Card>
                                                        </Col>
                                                    )}

                                                    {/* Outdated Plugins List */}
                                                    {project.last_health_details
                                                        .plugins
                                                        ?.outdated_plugins &&
                                                        project
                                                            .last_health_details
                                                            .plugins
                                                            .outdated_plugins
                                                            .length > 0 && (
                                                            <Col xs={24}>
                                                                <Card
                                                                    size="small"
                                                                    title={
                                                                        <Text type="danger">
                                                                            <WarningOutlined />{" "}
                                                                            Outdated
                                                                            Plugins
                                                                            (
                                                                            {
                                                                                project
                                                                                    .last_health_details
                                                                                    .plugins
                                                                                    .outdated_plugins
                                                                                    .length
                                                                            }
                                                                            )
                                                                        </Text>
                                                                    }
                                                                >
                                                                    <Table
                                                                        size="small"
                                                                        dataSource={
                                                                            project
                                                                                .last_health_details
                                                                                .plugins
                                                                                .outdated_plugins
                                                                        }
                                                                        rowKey="name"
                                                                        pagination={
                                                                            false
                                                                        }
                                                                        columns={[
                                                                            {
                                                                                title: "Plugin",
                                                                                dataIndex:
                                                                                    "name",
                                                                                key: "name",
                                                                            },
                                                                            {
                                                                                title: "Current",
                                                                                dataIndex:
                                                                                    "current_version",
                                                                                key: "current",
                                                                            },
                                                                            {
                                                                                title: "Available",
                                                                                dataIndex:
                                                                                    "new_version",
                                                                                key: "new",
                                                                                render: (
                                                                                    v: string
                                                                                ) => (
                                                                                    <Tag color="green">
                                                                                        {
                                                                                            v
                                                                                        }
                                                                                    </Tag>
                                                                                ),
                                                                            },
                                                                        ]}
                                                                    />
                                                                </Card>
                                                            </Col>
                                                        )}
                                                </Row>
                                            )
                                        ) : (
                                            <div
                                                style={{
                                                    textAlign: "center",
                                                    padding: "40px 20px",
                                                    background:
                                                        "rgba(108, 30, 159, 0.02)",
                                                    borderRadius: 12,
                                                }}
                                            >
                                                <InfoCircleOutlined
                                                    style={{
                                                        fontSize: 32,
                                                        color: "#d9d9d9",
                                                        marginBottom: 12,
                                                    }}
                                                />
                                                <Paragraph type="secondary">
                                                    No health data available
                                                    yet. Configure the health
                                                    monitoring secret to start
                                                    collecting data.
                                                </Paragraph>
                                            </div>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: "reports",
                                label: (
                                    <Badge
                                        count={maintenanceReports?.length || 0}
                                        offset={[10, 0]}
                                        size="small"
                                    >
                                        <span>
                                            <FileTextOutlined /> Reports
                                        </span>
                                    </Badge>
                                ),
                                children: (
                                    <MaintenanceReportsTab
                                        projectId={project.id}
                                        reports={maintenanceReports || []}
                                        todos={project.todos || []}
                                        canUpdate={
                                            isAdmin || isManager || isDeveloper
                                        }
                                    />
                                ),
                            },
                        ]}
                    />
                </Card>
            </Space>

            {/* Project Edit Modal */}
            <Modal
                title="Edit Project"
                open={projectModalVisible}
                onCancel={() => {
                    setProjectModalVisible(false);
                    projectForm.resetFields();
                }}
                onOk={() => projectForm.submit()}
                width={650}
            >
                <Form
                    form={projectForm}
                    layout="vertical"
                    onFinish={handleUpdateProject}
                >
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="project_external_id"
                                label="Project External ID"
                            >
                                <Input
                                    placeholder="e.g., LP10001"
                                    style={{ fontFamily: "monospace" }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="maintenance_id"
                                label="Maintenance ID"
                            >
                                <Input
                                    placeholder="e.g., WV10109"
                                    style={{ fontFamily: "monospace" }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
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
                                extra={
                                    !isAdmin
                                        ? "Only admins can change the PM"
                                        : undefined
                                }
                            >
                                <Select
                                    allowClear
                                    placeholder="Assign a PM"
                                    showSearch
                                    optionFilterProp="label"
                                    disabled={!isAdmin}
                                    options={managers?.map((m) => ({
                                        value: m.id,
                                        label: m.name,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="developer_ids"
                                label="Developers"
                                extra={
                                    !isAdmin && !isManager
                                        ? "Only admins and PMs can change developers"
                                        : undefined
                                }
                            >
                                <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder="Assign developers"
                                    showSearch
                                    optionFilterProp="label"
                                    disabled={!isAdmin && !isManager}
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

                    <Divider orientation="left">Health Monitoring</Divider>

                    <Form.Item
                        name="health_check_secret"
                        label="Health Check Secret Key"
                        tooltip="Enter the secret key from the LSM Health Monitor WordPress plugin"
                    >
                        <Input.Password
                            placeholder="Paste secret key from WordPress plugin"
                            style={{ fontFamily: "monospace" }}
                        />
                    </Form.Item>

                    <Form.Item name="notes" label="Notes">
                        <TextArea rows={4} placeholder="Project notes..." />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Credential Modal */}
            <Modal
                title={editingCredential ? "Edit Credential" : "Add Credential"}
                open={credentialModalVisible}
                onCancel={() => {
                    setCredentialModalVisible(false);
                    credentialForm.resetFields();
                }}
                onOk={() => credentialForm.submit()}
                width={600}
            >
                <Form
                    form={credentialForm}
                    layout="vertical"
                    onFinish={handleSaveCredential}
                    initialValues={{ type: "wordpress" }}
                >
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[
                            {
                                required: true,
                                message: "Please enter credential title",
                            },
                        ]}
                    >
                        <Input placeholder="e.g., Main Server SSH" />
                    </Form.Item>
                    <Form.Item
                        name="type"
                        label="Type"
                        rules={[
                            {
                                required: true,
                                message: "Please select credential type",
                            },
                        ]}
                    >
                        <Select onChange={(value) => setCredentialType(value)}>
                            <Select.Option value="wordpress">
                                <Space>
                                    <GlobalOutlined />
                                    WordPress
                                </Space>
                            </Select.Option>
                            <Select.Option value="ssh">
                                <Space>
                                    <CloudServerOutlined />
                                    SSH
                                </Space>
                            </Select.Option>
                            <Select.Option value="ftp">
                                <Space>
                                    <CloudServerOutlined />
                                    FTP
                                </Space>
                            </Select.Option>
                            <Select.Option value="database">
                                <Space>
                                    <DatabaseOutlined />
                                    Database
                                </Space>
                            </Select.Option>
                            <Select.Option value="hosting">
                                <Space>
                                    <CloudServerOutlined />
                                    Hosting Panel
                                </Space>
                            </Select.Option>
                            <Select.Option value="email">
                                <Space>
                                    <MailOutlined />
                                    Email
                                </Space>
                            </Select.Option>
                            <Select.Option value="api">
                                <Space>
                                    <ApiOutlined />
                                    API Key
                                </Space>
                            </Select.Option>
                            <Select.Option value="other">
                                <Space>
                                    <KeyOutlined />
                                    Other
                                </Space>
                            </Select.Option>
                        </Select>
                    </Form.Item>

                    {/* Dynamic fields based on type */}
                    {(credentialType === "ssh" || credentialType === "ftp") && (
                        <>
                            <Form.Item
                                name="hostname"
                                label="Hostname / IP"
                                rules={[
                                    {
                                        required: true,
                                        message: "Please enter hostname or IP",
                                    },
                                ]}
                            >
                                <Input placeholder="e.g., 192.168.1.1 or server.example.com" />
                            </Form.Item>
                            <Form.Item name="port" label="Port">
                                <Input
                                    type="number"
                                    placeholder={
                                        credentialType === "ssh" ? "22" : "21"
                                    }
                                />
                            </Form.Item>
                        </>
                    )}

                    {credentialType === "database" && (
                        <>
                            <Form.Item
                                name="host"
                                label="Database Host"
                                rules={[
                                    {
                                        required: true,
                                        message: "Please enter database host",
                                    },
                                ]}
                            >
                                <Input placeholder="e.g., localhost or db.example.com" />
                            </Form.Item>
                            <Form.Item name="port" label="Port">
                                <Input type="number" placeholder="3306" />
                            </Form.Item>
                            <Form.Item
                                name="database_name"
                                label="Database Name"
                                rules={[
                                    {
                                        required: true,
                                        message: "Please enter database name",
                                    },
                                ]}
                            >
                                <Input placeholder="e.g., wordpress_db" />
                            </Form.Item>
                        </>
                    )}

                    <Form.Item name="username" label="Username">
                        <Input placeholder="Username or email" />
                    </Form.Item>
                    <Form.Item name="password" label="Password">
                        <Input.Password placeholder="Password or API key" />
                    </Form.Item>
                    <Form.Item
                        name="url"
                        label="URL"
                        rules={[
                            {
                                type: "url",
                                message: "Please enter a valid URL",
                            },
                        ]}
                    >
                        <Input placeholder="https://..." />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Share Credential Modal */}
            <Modal
                title={
                    <Space>
                        <ShareAltOutlined />
                        Share Credential: {sharingCredential?.title}
                    </Space>
                }
                open={shareModalVisible}
                onCancel={() => {
                    setShareModalVisible(false);
                    setSharingCredential(null);
                    setGeneratedShareUrl(null);
                    shareForm.resetFields();
                }}
                footer={
                    generatedShareUrl ? (
                        <Space>
                            <Button
                                onClick={() => {
                                    setGeneratedShareUrl(null);
                                    shareForm.resetFields();
                                    shareForm.setFieldsValue({
                                        expires_in: "24h",
                                        max_views: 1,
                                        show_username: true,
                                        show_password: true,
                                        show_url: true,
                                    });
                                }}
                            >
                                Create Another
                            </Button>
                            <Button
                                type="primary"
                                onClick={() => setShareModalVisible(false)}
                            >
                                Done
                            </Button>
                        </Space>
                    ) : (
                        <Space>
                            <Button onClick={() => setShareModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                loading={shareLoading}
                                onClick={() => shareForm.submit()}
                                icon={<ShareAltOutlined />}
                            >
                                Generate Share Link
                            </Button>
                        </Space>
                    )
                }
                width={500}
            >
                {generatedShareUrl ? (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: "50%",
                                background:
                                    "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 20px",
                            }}
                        >
                            <CheckCircleOutlined
                                style={{ fontSize: 40, color: "white" }}
                            />
                        </div>
                        <Title level={4} style={{ marginBottom: 8 }}>
                            Share Link Created!
                        </Title>
                        <Paragraph
                            type="secondary"
                            style={{ marginBottom: 20 }}
                        >
                            Copy the link below and send it to your recipient.
                        </Paragraph>
                        <Input.Group compact style={{ marginBottom: 16 }}>
                            <Input
                                style={{ width: "calc(100% - 80px)" }}
                                value={generatedShareUrl}
                                readOnly
                            />
                            <Button
                                type="primary"
                                icon={<CopyOutlined />}
                                onClick={copyShareUrl}
                            >
                                Copy
                            </Button>
                        </Input.Group>
                        <Space direction="vertical" size={4}>
                            <Text type="secondary">
                                <SafetyOutlined /> Link expires based on your
                                settings
                            </Text>
                            <Text type="secondary">
                                <ClockCircleOutlined /> Views are limited as
                                configured
                            </Text>
                        </Space>
                    </div>
                ) : (
                    <Form
                        form={shareForm}
                        layout="vertical"
                        onFinish={handleCreateShareLink}
                        initialValues={{
                            expires_in: "24h",
                            max_views: 1,
                            show_username: true,
                            show_password: true,
                            show_url: true,
                        }}
                    >
                        <Form.Item
                            name="expires_in"
                            label="Link Expires In"
                            rules={[{ required: true }]}
                        >
                            <Select>
                                <Select.Option value="1h">1 Hour</Select.Option>
                                <Select.Option value="6h">
                                    6 Hours
                                </Select.Option>
                                <Select.Option value="24h">
                                    24 Hours
                                </Select.Option>
                                <Select.Option value="48h">
                                    48 Hours
                                </Select.Option>
                                <Select.Option value="7d">7 Days</Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="max_views"
                            label="Maximum Views"
                            rules={[{ required: true }]}
                            extra="After this many views, the link will be deactivated"
                        >
                            <Select>
                                <Select.Option value={1}>
                                    1 view (one-time)
                                </Select.Option>
                                <Select.Option value={3}>3 views</Select.Option>
                                <Select.Option value={5}>5 views</Select.Option>
                                <Select.Option value={10}>
                                    10 views
                                </Select.Option>
                                <Select.Option value={100}>
                                    Unlimited (100)
                                </Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="access_password"
                            label="Access Password (Optional)"
                            extra="Recipient will need this password to view the credential"
                        >
                            <Input.Password placeholder="Leave empty for no password" />
                        </Form.Item>

                        <Form.Item
                            name="recipient_email"
                            label="Recipient Email (Optional)"
                            rules={[
                                {
                                    type: "email",
                                    message: "Please enter a valid email",
                                },
                            ]}
                            extra="For your records only - no email will be sent"
                        >
                            <Input placeholder="client@example.com" />
                        </Form.Item>

                        <Divider>What to Share</Divider>

                        <Space size="large">
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

                        <Form.Item
                            name="note"
                            label="Note to Recipient (Optional)"
                            style={{ marginTop: 16 }}
                        >
                            <TextArea
                                rows={2}
                                placeholder="Any additional instructions..."
                                maxLength={500}
                                showCount
                            />
                        </Form.Item>
                    </Form>
                )}
            </Modal>

            {/* Todo Modal */}
            <Modal
                title={editingTodo ? "Edit Todo" : "Add Todo"}
                open={todoModalVisible}
                onCancel={() => {
                    setTodoModalVisible(false);
                    todoForm.resetFields();
                    setTodoFileList([]);
                }}
                onOk={() => todoForm.submit()}
                width={600}
            >
                <Form
                    form={todoForm}
                    layout="vertical"
                    onFinish={handleSaveTodo}
                    initialValues={{ priority: 0, completed: false }}
                >
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[
                            {
                                required: true,
                                message: "Please enter todo title",
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="priority" label="Priority">
                        <Select>
                            <Select.Option value={0}>Normal</Select.Option>
                            <Select.Option value={1}>High</Select.Option>
                            <Select.Option value={2}>Urgent</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="due_date" label="Due Date">
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                        name="assignee_id"
                        label="Assign To"
                        extra="Assign this todo to a team member"
                    >
                        <Select
                            allowClear
                            placeholder="Select assignee"
                            showSearch
                            optionFilterProp="label"
                            options={[
                                // Add project manager if exists
                                ...(project.manager
                                    ? [
                                          {
                                              value: project.manager.id,
                                              label: `${project.manager.name} (PM)`,
                                          },
                                      ]
                                    : []),
                                // Add all project developers
                                ...(project.developers?.map((d) => ({
                                    value: d.id,
                                    label: `${d.name} (Developer)`,
                                })) || []),
                            ]}
                        />
                    </Form.Item>
                    <Form.Item
                        label="Attachment"
                        extra="Maximum file size: 10MB"
                    >
                        <Upload
                            fileList={todoFileList}
                            beforeUpload={() => false}
                            onChange={({ fileList }) =>
                                setTodoFileList(fileList)
                            }
                            maxCount={1}
                        >
                            <Button icon={<UploadOutlined />}>
                                Select File
                            </Button>
                        </Upload>
                        {editingTodo?.file_name &&
                            todoFileList.length === 0 && (
                                <div style={{ marginTop: 8 }}>
                                    <Space>
                                        <PaperClipOutlined />
                                        <span>{editingTodo.file_name}</span>
                                        <a
                                            href={route("todos.download", [
                                                project.id,
                                                editingTodo.id,
                                            ])}
                                            download
                                        >
                                            <Button
                                                type="link"
                                                size="small"
                                                icon={<DownloadOutlined />}
                                            >
                                                Download
                                            </Button>
                                        </a>
                                    </Space>
                                </div>
                            )}
                    </Form.Item>
                    {editingTodo?.file_name && (
                        <Form.Item name="remove_file" valuePropName="checked">
                            <Checkbox>Remove current attachment</Checkbox>
                        </Form.Item>
                    )}
                    {editingTodo && (
                        <Form.Item name="completed" valuePropName="checked">
                            <Checkbox>Completed</Checkbox>
                        </Form.Item>
                    )}
                </Form>
            </Modal>

            {/* Todo View Modal */}
            <Modal
                title="Todo Details"
                open={todoViewModalVisible}
                onCancel={() => {
                    setTodoViewModalVisible(false);
                    setViewingTodo(null);
                }}
                footer={[
                    <Button
                        key="edit"
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setTodoViewModalVisible(false);
                            if (viewingTodo) handleEditTodo(viewingTodo);
                        }}
                    >
                        Edit
                    </Button>,
                    <Button
                        key="close"
                        onClick={() => {
                            setTodoViewModalVisible(false);
                            setViewingTodo(null);
                        }}
                    >
                        Close
                    </Button>,
                ]}
                width={600}
            >
                {viewingTodo && (
                    <Space
                        direction="vertical"
                        style={{ width: "100%" }}
                        size="middle"
                    >
                        <div>
                            <Text type="secondary">Title</Text>
                            <Title level={4} style={{ margin: "4px 0" }}>
                                {viewingTodo.title}
                            </Title>
                        </div>

                        <Space size="large">
                            <div>
                                <Text type="secondary">Status</Text>
                                <div>
                                    <Tag
                                        color={
                                            viewingTodo.completed
                                                ? "success"
                                                : "default"
                                        }
                                    >
                                        {viewingTodo.completed
                                            ? "Completed"
                                            : "Pending"}
                                    </Tag>
                                </div>
                            </div>
                            <div>
                                <Text type="secondary">Priority</Text>
                                <div>
                                    <Tag
                                        color={getPriorityColor(
                                            viewingTodo.priority
                                        )}
                                    >
                                        {getPriorityText(viewingTodo.priority)}
                                    </Tag>
                                </div>
                            </div>
                            <div>
                                <Text type="secondary">Due Date</Text>
                                <div>
                                    {viewingTodo.due_date
                                        ? dayjs(viewingTodo.due_date).format(
                                              "MMM DD, YYYY"
                                          )
                                        : "-"}
                                </div>
                            </div>
                        </Space>

                        {viewingTodo.description && (
                            <div>
                                <Text type="secondary">Description</Text>
                                <Card
                                    size="small"
                                    style={{ backgroundColor: "#fafafa" }}
                                >
                                    <Paragraph
                                        style={{
                                            whiteSpace: "pre-wrap",
                                            margin: 0,
                                        }}
                                    >
                                        {viewingTodo.description}
                                    </Paragraph>
                                </Card>
                            </div>
                        )}

                        {viewingTodo.file_name && (
                            <div>
                                <Text type="secondary">Attachment</Text>
                                <div style={{ marginTop: 8 }}>
                                    <a
                                        href={route("todos.download", [
                                            project.id,
                                            viewingTodo.id,
                                        ])}
                                        download
                                    >
                                        <Button icon={<DownloadOutlined />}>
                                            <PaperClipOutlined
                                                style={{ marginRight: 8 }}
                                            />
                                            {viewingTodo.file_name}
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        )}
                    </Space>
                )}
            </Modal>

            {/* Resource Modal */}
            <Modal
                title={editingResource ? "Edit Resource" : "Add Resource"}
                open={resourceModalVisible}
                onCancel={() => {
                    setResourceModalVisible(false);
                    resourceForm.resetFields();
                    setFileList([]);
                }}
                onOk={() => resourceForm.submit()}
                width={600}
            >
                <Form
                    form={resourceForm}
                    layout="vertical"
                    onFinish={handleSaveResource}
                    initialValues={{ type: "link" }}
                >
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[
                            {
                                required: true,
                                message: "Please enter resource title",
                            },
                        ]}
                    >
                        <Input placeholder="Resource title" />
                    </Form.Item>
                    <Form.Item
                        name="type"
                        label="Type"
                        rules={[
                            {
                                required: true,
                                message: "Please select resource type",
                            },
                        ]}
                    >
                        <Select
                            onChange={(value) => setResourceType(value)}
                            options={[
                                { value: "link", label: "Link" },
                                { value: "file", label: "File Upload" },
                            ]}
                        />
                    </Form.Item>
                    {resourceType === "link" && (
                        <Form.Item
                            name="url"
                            label="URL"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter URL",
                                },
                                {
                                    type: "url",
                                    message: "Please enter a valid URL",
                                },
                            ]}
                        >
                            <Input placeholder="https://..." />
                        </Form.Item>
                    )}
                    {resourceType === "file" && (
                        <Form.Item
                            label="File"
                            required={!editingResource}
                            extra="Maximum file size: 10MB"
                        >
                            <Upload
                                fileList={fileList}
                                beforeUpload={() => false}
                                onChange={({ fileList }) =>
                                    setFileList(fileList)
                                }
                                maxCount={1}
                            >
                                <Button icon={<UploadOutlined />}>
                                    Select File
                                </Button>
                            </Upload>
                            {editingResource?.file_name &&
                                fileList.length === 0 && (
                                    <div
                                        style={{ marginTop: 8, color: "#888" }}
                                    >
                                        Current file:{" "}
                                        {editingResource.file_name}
                                    </div>
                                )}
                        </Form.Item>
                    )}
                    <Form.Item name="notes" label="Notes">
                        <TextArea
                            rows={3}
                            placeholder="Optional notes about this resource"
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Health Secret Modal */}
            <Modal
                title={
                    <Space>
                        <SafetyOutlined style={{ color: "#6c1e9f" }} />
                        <span>Health Monitoring Configuration</span>
                    </Space>
                }
                open={healthSecretModalVisible}
                onCancel={() => {
                    setHealthSecretModalVisible(false);
                    healthSecretForm.resetFields();
                }}
                onOk={() => healthSecretForm.submit()}
                okText="Save"
                width={500}
            >
                <Form
                    form={healthSecretForm}
                    layout="vertical"
                    onFinish={handleSaveHealthSecret}
                >
                    <div
                        style={{
                            background: "rgba(108, 30, 159, 0.05)",
                            padding: 16,
                            borderRadius: 8,
                            marginBottom: 16,
                        }}
                    >
                        <Text type="secondary">
                            <InfoCircleOutlined style={{ marginRight: 8 }} />
                            To get the secret key:
                        </Text>
                        <ol style={{ margin: "8px 0 0 0", paddingLeft: 20 }}>
                            <li>
                                Install the <strong>LSM Health Monitor</strong>{" "}
                                plugin on your WordPress site
                            </li>
                            <li>
                                Go to{" "}
                                <strong>Settings → LSM Health Monitor</strong>
                            </li>
                            <li>Copy the Secret Key and paste it below</li>
                        </ol>
                    </div>

                    <Form.Item
                        name="health_check_secret"
                        label="Secret Key"
                        rules={[
                            {
                                required: true,
                                message: "Please enter the secret key",
                            },
                        ]}
                    >
                        <Input.Password
                            placeholder="Paste secret key from WordPress plugin"
                            style={{ fontFamily: "monospace" }}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </AuthenticatedLayout>
    );
}

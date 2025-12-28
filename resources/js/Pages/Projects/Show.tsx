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
} from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    LoadingOutlined,
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
} from "@ant-design/icons";
import { useState } from "react";
import dayjs from "dayjs";

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

interface Credential {
    id: number;
    title: string;
    type: string;
    username: string;
    password: string;
    url: string;
}

interface Resource {
    id: number;
    title: string;
    type: string;
    url: string;
    file_path: string;
}

interface Todo {
    id: number;
    title: string;
    description: string;
    completed: boolean;
    priority: number;
    due_date: string;
}

interface Project {
    id: number;
    name: string;
    url: string;
    client_email: string;
    notes: string;
    health_status: string;
    security_status: string;
    created_at: string;
    updated_at: string;
    credentials: Credential[];
    resources: Resource[];
    todos: Todo[];
}

interface ProjectShowProps {
    project: Project;
}

export default function ProjectShow({ project }: ProjectShowProps) {
    const [visiblePasswords, setVisiblePasswords] = useState<{
        [key: number]: boolean;
    }>({});
    const [credentialModalVisible, setCredentialModalVisible] = useState(false);
    const [todoModalVisible, setTodoModalVisible] = useState(false);
    const [projectModalVisible, setProjectModalVisible] = useState(false);
    const [editingCredential, setEditingCredential] =
        useState<Credential | null>(null);
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

    const [credentialForm] = Form.useForm();
    const [todoForm] = Form.useForm();
    const [projectForm] = Form.useForm();

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

    // Credential Handlers
    const handleAddCredential = () => {
        setEditingCredential(null);
        credentialForm.resetFields();
        setCredentialModalVisible(true);
    };

    const handleEditCredential = (credential: Credential) => {
        setEditingCredential(credential);
        credentialForm.setFieldsValue(credential);
        setCredentialModalVisible(true);
    };

    const handleSaveCredential = (values: any) => {
        if (editingCredential) {
            router.put(
                route("credentials.update", [project.id, editingCredential.id]),
                values,
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
            router.post(route("credentials.store", project.id), values, {
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

    // Todo Handlers
    const handleAddTodo = () => {
        setEditingTodo(null);
        todoForm.resetFields();
        setTodoModalVisible(true);
    };

    const handleEditTodo = (todo: Todo) => {
        setEditingTodo(todo);
        todoForm.setFieldsValue({
            ...todo,
            due_date: todo.due_date ? dayjs(todo.due_date) : null,
        });
        setTodoModalVisible(true);
    };

    const handleSaveTodo = (values: any) => {
        const data = {
            ...values,
            due_date: values.due_date
                ? values.due_date.format("YYYY-MM-DD")
                : null,
        };

        if (editingTodo) {
            router.put(
                route("todos.update", [project.id, editingTodo.id]),
                data,
                {
                    onSuccess: () => {
                        message.success("Todo updated successfully!");
                        setTodoModalVisible(false);
                        todoForm.resetFields();
                    },
                    onError: () => {
                        message.error("Failed to update todo");
                    },
                }
            );
        } else {
            router.post(route("todos.store", project.id), data, {
                onSuccess: () => {
                    message.success("Todo added successfully!");
                    setTodoModalVisible(false);
                    todoForm.resetFields();
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
                ...todo,
                completed: !todo.completed,
            },
            {
                onSuccess: () => {
                    message.success("Todo updated!");
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

    const getHealthIcon = (status: string) => {
        switch (status) {
            case "up":
                return <CheckCircleOutlined />;
            case "down":
                return <CloseCircleOutlined />;
            case "maintenance":
                return <LoadingOutlined />;
            default:
                return null;
        }
    };

    const getSecurityIcon = (status: string) => {
        switch (status) {
            case "secure":
                return <LockOutlined />;
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
            case "up":
                return "success";
            case "down":
                return "error";
            case "maintenance":
                return "processing";
            default:
                return "default";
        }
    };

    const getSecurityColor = (status: string) => {
        switch (status) {
            case "secure":
                return "success";
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
            render: (type: string) => <Tag>{type.toUpperCase()}</Tag>,
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
            title: "Actions",
            key: "actions",
            render: (_: any, record: Credential) => (
                <Space>
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditCredential(record)}
                    />
                    <Popconfirm
                        title="Are you sure to delete this credential?"
                        onConfirm={() => handleDeleteCredential(record.id)}
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
                >
                    {type.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Link/File",
            key: "resource",
            render: (_: any, record: Resource) =>
                record.type === "link" ? (
                    <a
                        href={record.url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button type="link">Open Link</Button>
                    </a>
                ) : (
                    <Button type="link">Download File</Button>
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
                <span
                    style={{
                        textDecoration: record.completed
                            ? "line-through"
                            : "none",
                    }}
                >
                    {title}
                </span>
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
            title: "Actions",
            key: "actions",
            render: (_: any, record: Todo) => (
                <Space>
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
                    extra={
                        <Space>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={handleEditProject}
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
                                <Button danger icon={<DeleteOutlined />}>
                                    Delete Project
                                </Button>
                            </Popconfirm>
                        </Space>
                    }
                >
                    <Space direction="vertical" style={{ width: "100%" }}>
                        <Space>
                            <Title level={3} style={{ margin: 0 }}>
                                {project.name}
                            </Title>
                            <Tag
                                color={getHealthColor(project.health_status)}
                                icon={getHealthIcon(project.health_status)}
                            >
                                {project.health_status
                                    .replace("_", " ")
                                    .toUpperCase()}
                            </Tag>
                            <Tag
                                color={getSecurityColor(
                                    project.security_status
                                )}
                                icon={getSecurityIcon(project.security_status)}
                            >
                                {project.security_status.toUpperCase()}
                            </Tag>
                        </Space>
                        <Descriptions column={2}>
                            <Descriptions.Item label="Website URL">
                                <a
                                    href={project.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {project.url}
                                </a>
                            </Descriptions.Item>
                            <Descriptions.Item label="Client Email">
                                <a href={`mailto:${project.client_email}`}>
                                    {project.client_email}
                                </a>
                            </Descriptions.Item>
                        </Descriptions>
                    </Space>
                </Card>

                {/* Tabs */}
                <Card>
                    <Tabs defaultActiveKey="overview">
                        <Tabs.TabPane tab="Overview" key="overview">
                            <Space
                                direction="vertical"
                                style={{ width: "100%" }}
                            >
                                {project.notes ? (
                                    <div>
                                        <Title level={5}>Notes</Title>
                                        <Card
                                            size="small"
                                            style={{
                                                backgroundColor: "#fafafa",
                                            }}
                                        >
                                            <Paragraph
                                                style={{
                                                    whiteSpace: "pre-wrap",
                                                }}
                                            >
                                                {project.notes}
                                            </Paragraph>
                                        </Card>
                                    </div>
                                ) : (
                                    <Paragraph type="secondary">
                                        No notes available
                                    </Paragraph>
                                )}
                            </Space>
                        </Tabs.TabPane>

                        <Tabs.TabPane
                            tab={
                                <Badge
                                    count={project.credentials.length}
                                    offset={[10, 0]}
                                >
                                    <span>Credentials</span>
                                </Badge>
                            }
                            key="credentials"
                        >
                            <Space
                                direction="vertical"
                                style={{ width: "100%" }}
                            >
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={handleAddCredential}
                                >
                                    Add Credential
                                </Button>
                                <Table
                                    columns={credentialColumns}
                                    dataSource={project.credentials}
                                    rowKey="id"
                                    pagination={false}
                                />
                            </Space>
                        </Tabs.TabPane>

                        <Tabs.TabPane
                            tab={
                                <Badge
                                    count={project.resources.length}
                                    offset={[10, 0]}
                                >
                                    <span>Resources</span>
                                </Badge>
                            }
                            key="resources"
                        >
                            <Table
                                columns={resourceColumns}
                                dataSource={project.resources}
                                rowKey="id"
                                pagination={false}
                            />
                        </Tabs.TabPane>

                        <Tabs.TabPane
                            tab={
                                <Badge
                                    count={project.todos?.length || 0}
                                    offset={[10, 0]}
                                >
                                    <span>Todos</span>
                                </Badge>
                            }
                            key="todos"
                        >
                            <Space
                                direction="vertical"
                                style={{ width: "100%" }}
                            >
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={handleAddTodo}
                                >
                                    Add Todo
                                </Button>
                                <Table
                                    columns={todoColumns}
                                    dataSource={project.todos || []}
                                    rowKey="id"
                                    pagination={false}
                                />
                            </Space>
                        </Tabs.TabPane>
                    </Tabs>
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
                width={600}
            >
                <Form
                    form={projectForm}
                    layout="vertical"
                    onFinish={handleUpdateProject}
                >
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
                        <Input />
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
                        <Input />
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
                        <Input />
                    </Form.Item>
                    <Form.Item name="notes" label="Notes">
                        <TextArea rows={4} />
                    </Form.Item>
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
                            <Select.Option value="up">Up</Select.Option>
                            <Select.Option value="down">Down</Select.Option>
                            <Select.Option value="maintenance">
                                Maintenance
                            </Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="security_status"
                        label="Security Status"
                        rules={[
                            {
                                required: true,
                                message: "Please select security status",
                            },
                        ]}
                    >
                        <Select>
                            <Select.Option value="secure">Secure</Select.Option>
                            <Select.Option value="compromised">
                                Compromised
                            </Select.Option>
                            <Select.Option value="hacked">Hacked</Select.Option>
                        </Select>
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
                        <Input />
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
                        <Select>
                            <Select.Option value="ssh">SSH</Select.Option>
                            <Select.Option value="ftp">FTP</Select.Option>
                            <Select.Option value="db">Database</Select.Option>
                            <Select.Option value="wp_admin">
                                WordPress Admin
                            </Select.Option>
                            <Select.Option value="api">API</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="username" label="Username">
                        <Input />
                    </Form.Item>
                    <Form.Item name="password" label="Password">
                        <Input.Password />
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
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Todo Modal */}
            <Modal
                title={editingTodo ? "Edit Todo" : "Add Todo"}
                open={todoModalVisible}
                onCancel={() => {
                    setTodoModalVisible(false);
                    todoForm.resetFields();
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
                    {editingTodo && (
                        <Form.Item name="completed" valuePropName="checked">
                            <Checkbox>Completed</Checkbox>
                        </Form.Item>
                    )}
                </Form>
            </Modal>
        </AuthenticatedLayout>
    );
}

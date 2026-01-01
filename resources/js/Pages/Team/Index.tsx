import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";
import {
    Card,
    Table,
    Button,
    Space,
    Typography,
    Tag,
    Modal,
    Form,
    Input,
    Select,
    Popconfirm,
    message,
    Badge,
    Transfer,
    Spin,
} from "antd";
import type { TransferProps } from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    SearchOutlined,
    ProjectOutlined,
    SettingOutlined,
    CodeOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import axios from "axios";

const { Title } = Typography;

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    managed_projects_count: number;
    assigned_projects_count: number;
    created_at: string;
}

interface Project {
    id: number;
    name: string;
    manager_id: number | null;
}

interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    users: PaginatedUsers;
    filters: {
        search?: string;
        role?: string;
    };
    allProjects: Project[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Index({ users, filters, allProjects, flash }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [form] = Form.useForm();
    const [searchValue, setSearchValue] = useState(filters.search || "");

    // PM Project assignment modal state
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [targetKeys, setTargetKeys] = useState<string[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [savingProjects, setSavingProjects] = useState(false);

    // Developer Project assignment modal state
    const [isDevProjectModalOpen, setIsDevProjectModalOpen] = useState(false);
    const [devTargetKeys, setDevTargetKeys] = useState<string[]>([]);
    const [loadingDevProjects, setLoadingDevProjects] = useState(false);
    const [savingDevProjects, setSavingDevProjects] = useState(false);

    // Transform projects for Transfer component
    const projectDataSource = allProjects.map((project) => ({
        key: project.id.toString(),
        title: project.name,
        description: project.manager_id
            ? `Currently assigned to: ${
                  users.data.find((u) => u.id === project.manager_id)?.name ||
                  "Unknown"
              }`
            : "Unassigned",
    }));

    // Open project assignment modal
    const handleOpenProjectModal = async (user: User) => {
        setSelectedUser(user);
        setIsProjectModalOpen(true);
        setLoadingProjects(true);

        try {
            const response = await axios.get(route("team.projects", user.id));
            setTargetKeys(
                response.data.managed_project_ids.map((id: number) =>
                    id.toString()
                )
            );
        } catch (error) {
            message.error("Failed to load user projects");
        } finally {
            setLoadingProjects(false);
        }
    };

    // Handle Transfer component change
    const handleTransferChange: TransferProps["onChange"] = (newTargetKeys) => {
        setTargetKeys(newTargetKeys as string[]);
    };

    // Save project assignments
    const handleSaveProjects = async () => {
        if (!selectedUser) return;

        setSavingProjects(true);
        router.put(
            route("team.updateProjects", selectedUser.id),
            { project_ids: targetKeys.map((k) => parseInt(k)) },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsProjectModalOpen(false);
                    setSelectedUser(null);
                    setTargetKeys([]);
                },
                onFinish: () => {
                    setSavingProjects(false);
                },
            }
        );
    };

    // Open developer project assignment modal
    const handleOpenDevProjectModal = async (user: User) => {
        setSelectedUser(user);
        setIsDevProjectModalOpen(true);
        setLoadingDevProjects(true);

        try {
            const response = await axios.get(
                route("team.developerProjects", user.id)
            );
            setDevTargetKeys(
                response.data.assigned_project_ids.map((id: number) =>
                    id.toString()
                )
            );
        } catch (error) {
            message.error("Failed to load developer projects");
        } finally {
            setLoadingDevProjects(false);
        }
    };

    // Handle Developer Transfer component change
    const handleDevTransferChange: TransferProps["onChange"] = (
        newTargetKeys
    ) => {
        setDevTargetKeys(newTargetKeys as string[]);
    };

    // Save developer project assignments
    const handleSaveDevProjects = async () => {
        if (!selectedUser) return;

        setSavingDevProjects(true);
        router.put(
            route("team.updateDeveloperProjects", selectedUser.id),
            { project_ids: devTargetKeys.map((k) => parseInt(k)) },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDevProjectModalOpen(false);
                    setSelectedUser(null);
                    setDevTargetKeys([]);
                },
                onFinish: () => {
                    setSavingDevProjects(false);
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

    const getRoleColor = (role: string) => {
        switch (role) {
            case "admin":
                return "red";
            case "manager":
                return "blue";
            case "developer":
                return "green";
            case "viewer":
                return "default";
            default:
                return "default";
        }
    };

    // Single "Projects" column that shows appropriate data based on role
    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            render: (name: string) => (
                <Space>
                    <UserOutlined />
                    {name}
                </Space>
            ),
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            render: (role: string) => (
                <Tag color={getRoleColor(role)}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                </Tag>
            ),
        },
        {
            title: "Projects",
            key: "projects",
            render: (_: unknown, record: User) => {
                // Developers: show assigned projects (green)
                if (record.role === "developer") {
                    return (
                        <Button
                            type="text"
                            onClick={() => handleOpenDevProjectModal(record)}
                            style={{ padding: "4px 8px" }}
                            title="Manage developer assignments"
                        >
                            <Badge count={record.assigned_projects_count} showZero color="#52c41a">
                                <CodeOutlined style={{ fontSize: 18 }} />
                            </Badge>
                            <SettingOutlined
                                style={{
                                    marginLeft: 8,
                                    color: "#8c8c8c",
                                    fontSize: 12,
                                }}
                            />
                        </Button>
                    );
                }
                // Managers & Admins: show managed projects (purple)
                if (record.role === "manager" || record.role === "admin") {
                    return (
                        <Button
                            type="text"
                            onClick={() => handleOpenProjectModal(record)}
                            style={{ padding: "4px 8px" }}
                            title="Manage PM assignments"
                        >
                            <Badge count={record.managed_projects_count} showZero color="#6c1e9f">
                                <ProjectOutlined style={{ fontSize: 18 }} />
                            </Badge>
                            <SettingOutlined
                                style={{
                                    marginLeft: 8,
                                    color: "#8c8c8c",
                                    fontSize: 12,
                                }}
                            />
                        </Button>
                    );
                }
                // Viewers: no project assignment
                return <span style={{ color: "#d9d9d9" }}>—</span>;
            },
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: unknown, record: User) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="Delete team member"
                        description="Are you sure you want to remove this team member?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const handleEdit = (user: User) => {
        setEditingUser(user);
        form.setFieldsValue({
            name: user.name,
            email: user.email,
            role: user.role,
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        router.delete(route("team.destroy", id), {
            preserveScroll: true,
        });
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            if (editingUser) {
                router.put(route("team.update", editingUser.id), values, {
                    preserveScroll: true,
                    onSuccess: () => {
                        setIsModalOpen(false);
                        setEditingUser(null);
                        form.resetFields();
                    },
                });
            } else {
                router.post(route("team.store"), values, {
                    preserveScroll: true,
                    onSuccess: () => {
                        setIsModalOpen(false);
                        form.resetFields();
                    },
                });
            }
        } catch (error) {
            console.error("Validation failed:", error);
        }
    };

    const handleSearch = (value: string) => {
        router.get(
            route("team.index"),
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

    const handleRoleFilter = (value: string) => {
        router.get(
            route("team.index"),
            {
                ...filters,
                role: value || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleTableChange = (pagination: { current?: number }) => {
        router.get(
            route("team.index"),
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
                <div className="flex justify-between items-center">
                    <Title level={4} style={{ margin: 0 }}>
                        Team Management
                    </Title>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingUser(null);
                            form.resetFields();
                            setIsModalOpen(true);
                        }}
                    >
                        Add Team Member
                    </Button>
                </div>
            }
        >
            <Head title="Team" />

            <Card>
                <Space style={{ marginBottom: 16, width: "100%" }} wrap>
                    <Input.Search
                        placeholder="Search by name or email"
                        allowClear
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onSearch={handleSearch}
                        style={{ width: "100%", maxWidth: 300 }}
                        prefix={<SearchOutlined />}
                    />
                    <Select
                        placeholder="Filter by role"
                        allowClear
                        style={{ width: 150 }}
                        value={filters.role}
                        onChange={handleRoleFilter}
                        options={[
                            { value: "admin", label: "Admin" },
                            { value: "manager", label: "Manager" },
                            { value: "developer", label: "Developer" },
                            { value: "viewer", label: "Viewer" },
                        ]}
                    />
                </Space>

                <Table
                    columns={columns}
                    dataSource={users.data}
                    rowKey="id"
                    scroll={{ x: 600 }}
                    pagination={{
                        current: users.current_page,
                        pageSize: users.per_page,
                        total: users.total,
                        showSizeChanger: false,
                    }}
                    onChange={handleTableChange}
                />
            </Card>

            <Modal
                title={editingUser ? "Edit Team Member" : "Add Team Member"}
                open={isModalOpen}
                onOk={handleSubmit}
                onCancel={() => {
                    setIsModalOpen(false);
                    setEditingUser(null);
                    form.resetFields();
                }}
                okText={editingUser ? "Update" : "Create"}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[
                            { required: true, message: "Please enter name" },
                        ]}
                    >
                        <Input placeholder="Full name" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: "Please enter email" },
                            {
                                type: "email",
                                message: "Please enter a valid email",
                            },
                        ]}
                    >
                        <Input placeholder="Email address" />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[
                            { required: true, message: "Please select a role" },
                        ]}
                    >
                        <Select
                            placeholder="Select role"
                            options={[
                                { value: "admin", label: "Admin" },
                                { value: "manager", label: "Manager" },
                                { value: "developer", label: "Developer" },
                                { value: "viewer", label: "Viewer" },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[
                            {
                                required: !editingUser,
                                message: "Please enter password",
                            },
                            {
                                min: 8,
                                message:
                                    "Password must be at least 8 characters",
                            },
                        ]}
                        extra={
                            editingUser
                                ? "Leave blank to keep current password"
                                : undefined
                        }
                    >
                        <Input.Password placeholder="Password" />
                    </Form.Item>

                    <Form.Item
                        name="password_confirmation"
                        label="Confirm Password"
                        dependencies={["password"]}
                        rules={[
                            {
                                required: !editingUser,
                                message: "Please confirm password",
                            },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (
                                        !value ||
                                        getFieldValue("password") === value
                                    ) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(
                                        new Error("Passwords do not match")
                                    );
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder="Confirm password" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Project Assignment Modal */}
            <Modal
                title={
                    <Space>
                        <ProjectOutlined />
                        <span>Manage Projects for {selectedUser?.name}</span>
                    </Space>
                }
                open={isProjectModalOpen}
                onOk={handleSaveProjects}
                onCancel={() => {
                    setIsProjectModalOpen(false);
                    setSelectedUser(null);
                    setTargetKeys([]);
                }}
                okText="Save Assignments"
                cancelText="Cancel"
                width={700}
                confirmLoading={savingProjects}
            >
                {loadingProjects ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <Spin size="large" />
                        <p style={{ marginTop: 16, color: "#8c8c8c" }}>
                            Loading projects...
                        </p>
                    </div>
                ) : (
                    <>
                        <p style={{ marginBottom: 16, color: "#666" }}>
                            Select projects to assign to{" "}
                            <strong>{selectedUser?.name}</strong>. Move projects
                            from left (available) to right (assigned).
                        </p>
                        <Transfer
                            dataSource={projectDataSource}
                            titles={["Available Projects", "Assigned Projects"]}
                            targetKeys={targetKeys}
                            onChange={handleTransferChange}
                            render={(item) => (
                                <span title={item.description}>
                                    {item.title}
                                </span>
                            )}
                            listStyle={{
                                width: 300,
                                height: 350,
                            }}
                            showSearch
                            filterOption={(inputValue, option) =>
                                option.title
                                    .toLowerCase()
                                    .includes(inputValue.toLowerCase())
                            }
                            locale={{
                                itemUnit: "project",
                                itemsUnit: "projects",
                                searchPlaceholder: "Search projects...",
                            }}
                        />
                        <div
                            style={{
                                marginTop: 12,
                                fontSize: 12,
                                color: "#8c8c8c",
                            }}
                        >
                            <strong>Note:</strong> Projects assigned to this
                            user as PM will be removed from their current
                            manager.
                        </div>
                    </>
                )}
            </Modal>

            {/* Developer Project Assignment Modal */}
            <Modal
                title={
                    <Space>
                        <CodeOutlined />
                        <span>
                            Manage Developer Projects for {selectedUser?.name}
                        </span>
                    </Space>
                }
                open={isDevProjectModalOpen}
                onOk={handleSaveDevProjects}
                onCancel={() => {
                    setIsDevProjectModalOpen(false);
                    setSelectedUser(null);
                    setDevTargetKeys([]);
                }}
                okText="Save Assignments"
                cancelText="Cancel"
                width={700}
                confirmLoading={savingDevProjects}
            >
                {loadingDevProjects ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <Spin size="large" />
                        <p style={{ marginTop: 16, color: "#8c8c8c" }}>
                            Loading projects...
                        </p>
                    </div>
                ) : (
                    <>
                        <p style={{ marginBottom: 16, color: "#666" }}>
                            Select projects to assign{" "}
                            <strong>{selectedUser?.name}</strong> as a
                            developer. A project can have multiple developers
                            assigned.
                        </p>
                        <Transfer
                            dataSource={projectDataSource}
                            titles={["Available Projects", "Assigned Projects"]}
                            targetKeys={devTargetKeys}
                            onChange={handleDevTransferChange}
                            render={(item) => (
                                <span title={item.description}>
                                    {item.title}
                                </span>
                            )}
                            listStyle={{
                                width: 300,
                                height: 350,
                            }}
                            showSearch
                            filterOption={(inputValue, option) =>
                                option.title
                                    .toLowerCase()
                                    .includes(inputValue.toLowerCase())
                            }
                            locale={{
                                itemUnit: "project",
                                itemsUnit: "projects",
                                searchPlaceholder: "Search projects...",
                            }}
                        />
                        <div
                            style={{
                                marginTop: 12,
                                fontSize: 12,
                                color: "#52c41a",
                            }}
                        >
                            <strong>Note:</strong> Multiple developers can be
                            assigned to the same project.
                        </div>
                    </>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { Table, Tag, Input, Select, Space, Button, Card } from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    LoadingOutlined,
    LockOutlined,
    EyeOutlined,
    WarningOutlined,
    BugOutlined,
    SearchOutlined,
    EyeOutlined as ViewIcon,
} from "@ant-design/icons";
import { useState } from "react";

const { Search } = Input;

interface Project {
    id: number;
    name: string;
    url: string;
    client_email: string;
    health_status: string;
    security_status: string;
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
    };
}

export default function ProjectsIndex({
    projects,
    filters,
}: ProjectsIndexProps) {
    const [searchValue, setSearchValue] = useState(filters.search || "");

    const getHealthIcon = (status: string) => {
        switch (status) {
            case "online":
                return <CheckCircleOutlined />;
            case "down_error":
                return <CloseCircleOutlined />;
            case "updating":
                return <LoadingOutlined />;
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

    const columns = [
        {
            title: "Project Name",
            dataIndex: "name",
            key: "name",
            render: (text: string, record: Project) => (
                <Link
                    href={route("projects.show", record.id)}
                    style={{ fontWeight: 500 }}
                >
                    {text}
                </Link>
            ),
        },
        {
            title: "URL",
            dataIndex: "url",
            key: "url",
            render: (text: string) => (
                <a href={text} target="_blank" rel="noopener noreferrer">
                    {text}
                </a>
            ),
        },
        {
            title: "Client Email",
            dataIndex: "client_email",
            key: "client_email",
        },
        {
            title: "Health",
            dataIndex: "health_status",
            key: "health_status",
            render: (status: string) => (
                <Tag
                    color={getHealthColor(status)}
                    icon={getHealthIcon(status)}
                >
                    {status.replace("_", " ").toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Security",
            dataIndex: "security_status",
            key: "security_status",
            render: (status: string) => (
                <Tag
                    color={getSecurityColor(status)}
                    icon={getSecurityIcon(status)}
                >
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: Project) => (
                <Link href={route("projects.show", record.id)}>
                    <Button type="link" icon={<ViewIcon />}>
                        View
                    </Button>
                </Link>
            ),
        },
    ];

    return (
        <AuthenticatedLayout header="Projects">
            <Head title="Projects" />

            <Card>
                <Space
                    direction="vertical"
                    size="large"
                    style={{ width: "100%" }}
                >
                    {/* Filters */}
                    <Space wrap>
                        <Search
                            placeholder="Search projects..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onSearch={handleSearch}
                            style={{ width: 300 }}
                            prefix={<SearchOutlined />}
                            allowClear
                        />
                        <Select
                            placeholder="Health Status"
                            style={{ width: 150 }}
                            value={filters.health || "all"}
                            onChange={(value) =>
                                handleFilterChange("health", value)
                            }
                            options={[
                                { value: "all", label: "All Health" },
                                { value: "online", label: "Online" },
                                { value: "down_error", label: "Down" },
                                { value: "updating", label: "Updating" },
                            ]}
                        />
                        <Select
                            placeholder="Security Status"
                            style={{ width: 150 }}
                            value={filters.security || "all"}
                            onChange={(value) =>
                                handleFilterChange("security", value)
                            }
                            options={[
                                { value: "all", label: "All Security" },
                                { value: "secure", label: "Secure" },
                                { value: "monitoring", label: "Monitoring" },
                                { value: "compromised", label: "Compromised" },
                                { value: "hacked", label: "Hacked" },
                            ]}
                        />
                    </Space>

                    {/* Table */}
                    <Table
                        columns={columns}
                        dataSource={projects.data}
                        rowKey="id"
                        pagination={{
                            current: projects.current_page,
                            pageSize: projects.per_page,
                            total: projects.total,
                            showSizeChanger: false,
                            onChange: (page) => {
                                router.get(
                                    route("projects.index"),
                                    {
                                        ...filters,
                                        page,
                                    },
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
        </AuthenticatedLayout>
    );
}

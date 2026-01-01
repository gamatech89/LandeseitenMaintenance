import { Head, router } from "@inertiajs/react";
import {
    Table,
    Card,
    Tag,
    Space,
    Input,
    Select,
    DatePicker,
    Button,
    Typography,
    Tooltip,
    Popover,
    Badge,
} from "antd";
import {
    SearchOutlined,
    ReloadOutlined,
    ClockCircleOutlined,
    UserOutlined,
    FileOutlined,
    SafetyOutlined,
    ProjectOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    KeyOutlined,
} from "@ant-design/icons";
import { useState, useEffect, useCallback } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import dayjs from "dayjs";
import debounce from "lodash/debounce";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

interface Activity {
    id: number;
    description: string;
    event: string | null;
    subject_type: string;
    subject_id: number | null;
    subject_name: string | null;
    causer_name: string;
    causer_email: string | null;
    properties: Record<string, unknown>;
    created_at: string;
    time_ago: string;
}

interface PaginatedActivities {
    data: Activity[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    activities: PaginatedActivities;
    eventTypes: string[];
    filters: {
        event?: string;
        subject_type?: string;
        from_date?: string;
        to_date?: string;
        search?: string;
    };
}

export default function Index({ activities, eventTypes, filters }: Props) {
    const [searchValue, setSearchValue] = useState(filters.search || "");

    const getEventIcon = (description: string) => {
        if (description.includes("created"))
            return <PlusOutlined style={{ color: "#52c41a" }} />;
        if (description.includes("updated"))
            return <EditOutlined style={{ color: "#1890ff" }} />;
        if (description.includes("deleted"))
            return <DeleteOutlined style={{ color: "#ff4d4f" }} />;
        if (description.includes("password_revealed"))
            return <KeyOutlined style={{ color: "#faad14" }} />;
        return <EyeOutlined style={{ color: "#8c8c8c" }} />;
    };

    const getEventColor = (description: string) => {
        if (description.includes("created")) return "success";
        if (description.includes("updated")) return "processing";
        if (description.includes("deleted")) return "error";
        if (description.includes("password_revealed")) return "warning";
        return "default";
    };

    const getSubjectIcon = (subjectType: string) => {
        switch (subjectType) {
            case "Project":
                return <ProjectOutlined />;
            case "Credential":
                return <SafetyOutlined />;
            case "User":
                return <UserOutlined />;
            default:
                return <FileOutlined />;
        }
    };

    const formatDescription = (description: string) => {
        return description
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const debouncedSearch = useCallback(
        debounce((value: string) => {
            router.get(
                route("activity.index"),
                { ...filters, search: value || undefined },
                { preserveState: true, preserveScroll: true }
            );
        }, 300),
        [filters]
    );

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    const handleSearch = (value: string) => {
        setSearchValue(value);
        debouncedSearch(value);
    };

    const handleFilterChange = (
        key: string,
        value: string | string[] | null
    ) => {
        router.get(
            route("activity.index"),
            { ...filters, [key]: value || undefined, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleDateRangeChange = (
        dates: [dayjs.Dayjs, dayjs.Dayjs] | null
    ) => {
        router.get(
            route("activity.index"),
            {
                ...filters,
                from_date: dates?.[0]?.format("YYYY-MM-DD") || undefined,
                to_date: dates?.[1]?.format("YYYY-MM-DD") || undefined,
                page: 1,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handlePagination = (page: number) => {
        router.get(
            route("activity.index"),
            { ...filters, page },
            { preserveState: true, preserveScroll: true }
        );
    };

    const clearFilters = () => {
        setSearchValue("");
        router.get(route("activity.index"), {}, { preserveState: true });
    };

    const columns = [
        {
            title: "Event",
            key: "event",
            width: 200,
            render: (_: unknown, record: Activity) => (
                <Space>
                    {getEventIcon(record.description)}
                    <Tag color={getEventColor(record.description)}>
                        {formatDescription(record.description)}
                    </Tag>
                </Space>
            ),
        },
        {
            title: "Subject",
            key: "subject",
            render: (_: unknown, record: Activity) => (
                <Space>
                    {getSubjectIcon(record.subject_type)}
                    <div>
                        <Text strong>{record.subject_name || "N/A"}</Text>
                        {record.subject_type && (
                            <div>
                                <Text
                                    type="secondary"
                                    style={{ fontSize: "12px" }}
                                >
                                    {record.subject_type}
                                </Text>
                            </div>
                        )}
                    </div>
                </Space>
            ),
        },
        {
            title: "User",
            key: "causer",
            render: (_: unknown, record: Activity) => (
                <Space>
                    <UserOutlined />
                    <div>
                        <Text>{record.causer_name}</Text>
                        {record.causer_email && (
                            <div>
                                <Text
                                    type="secondary"
                                    style={{ fontSize: "12px" }}
                                >
                                    {record.causer_email}
                                </Text>
                            </div>
                        )}
                    </div>
                </Space>
            ),
        },
        {
            title: "Details",
            key: "details",
            width: 80,
            render: (_: unknown, record: Activity) => {
                const properties = record.properties;
                if (!properties || Object.keys(properties).length === 0) {
                    return <Text type="secondary">-</Text>;
                }

                const content = (
                    <div style={{ maxWidth: 400 }}>
                        <pre
                            style={{
                                fontSize: 12,
                                margin: 0,
                                whiteSpace: "pre-wrap",
                            }}
                        >
                            {JSON.stringify(properties, null, 2)}
                        </pre>
                    </div>
                );

                return (
                    <Popover
                        content={content}
                        title="Activity Details"
                        trigger="click"
                    >
                        <Button type="text" size="small" icon={<EyeOutlined />}>
                            View
                        </Button>
                    </Popover>
                );
            },
        },
        {
            title: "Time",
            key: "time",
            width: 180,
            render: (_: unknown, record: Activity) => (
                <Tooltip title={record.created_at}>
                    <Space>
                        <ClockCircleOutlined />
                        <Text type="secondary">{record.time_ago}</Text>
                    </Space>
                </Tooltip>
            ),
        },
    ];

    const hasActiveFilters =
        filters.event ||
        filters.subject_type ||
        filters.from_date ||
        filters.to_date ||
        filters.search;

    return (
        <AuthenticatedLayout
            header={
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Title level={4} style={{ margin: 0, color: "#6c1e9f" }}>
                        Activity Log
                    </Title>
                    <Badge
                        count={activities.total}
                        overflowCount={999}
                        style={{ backgroundColor: "#6c1e9f" }}
                    >
                        <Text type="secondary">Total Events</Text>
                    </Badge>
                </div>
            }
        >
            <Head title="Activity Log" />

            <Card>
                {/* Filters */}
                <div
                    style={{
                        marginBottom: 24,
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <Input
                        placeholder="Search activities..."
                        prefix={<SearchOutlined />}
                        value={searchValue}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ width: "100%", maxWidth: 250, minWidth: 150 }}
                        allowClear
                    />

                    <Select
                        placeholder="Filter by event"
                        allowClear
                        style={{ width: 180, minWidth: 140 }}
                        value={filters.event}
                        onChange={(value) => handleFilterChange("event", value)}
                    >
                        {eventTypes.map((event) => (
                            <Select.Option key={event} value={event}>
                                {formatDescription(event)}
                            </Select.Option>
                        ))}
                    </Select>

                    <Select
                        placeholder="Filter by type"
                        allowClear
                        style={{ width: 150, minWidth: 120 }}
                        value={filters.subject_type}
                        onChange={(value) =>
                            handleFilterChange("subject_type", value)
                        }
                    >
                        <Select.Option value="Project">Project</Select.Option>
                        <Select.Option value="Credential">
                            Credential
                        </Select.Option>
                        <Select.Option value="User">User</Select.Option>
                        <Select.Option value="Todo">Todo</Select.Option>
                        <Select.Option value="Resource">Resource</Select.Option>
                    </Select>

                    <RangePicker
                        style={{ width: "100%", maxWidth: 280, minWidth: 200 }}
                        value={
                            filters.from_date && filters.to_date
                                ? [
                                      dayjs(filters.from_date),
                                      dayjs(filters.to_date),
                                  ]
                                : undefined
                        }
                        onChange={(dates) =>
                            handleDateRangeChange(
                                dates as [dayjs.Dayjs, dayjs.Dayjs] | null
                            )
                        }
                    />

                    {hasActiveFilters && (
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={clearFilters}
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>

                {/* Table */}
                <Table
                    columns={columns}
                    dataSource={activities.data}
                    rowKey="id"
                    scroll={{ x: 700 }}
                    pagination={{
                        current: activities.current_page,
                        total: activities.total,
                        pageSize: activities.per_page,
                        showSizeChanger: false,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} activities`,
                        onChange: handlePagination,
                    }}
                    size="middle"
                />
            </Card>
        </AuthenticatedLayout>
    );
}

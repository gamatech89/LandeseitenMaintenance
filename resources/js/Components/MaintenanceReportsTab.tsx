import React, { useState, useCallback } from "react";
import { router } from "@inertiajs/react";
import {
    Card,
    Table,
    Button,
    Space,
    Typography,
    Modal,
    Form,
    Input,
    Select,
    DatePicker,
    Popconfirm,
    message,
    Tag,
    List,
    Empty,
    Row,
    Col,
    InputNumber,
    Divider,
    AutoComplete,
    Checkbox,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    FileTextOutlined,
    ClockCircleOutlined,
    UserOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    ToolOutlined,
    DownloadOutlined,
    ImportOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface User {
    id: number;
    name: string;
}

interface Todo {
    id: number;
    title: string;
    status: "pending" | "in_progress" | "completed";
    completed_at?: string;
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

interface MaintenanceReportsTabProps {
    projectId: number;
    reports: MaintenanceReport[];
    todos?: Todo[];
    canUpdate: boolean;
}

export default function MaintenanceReportsTab({
    projectId,
    reports,
    todos = [],
    canUpdate,
}: MaintenanceReportsTabProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [importTodosModalVisible, setImportTodosModalVisible] =
        useState(false);
    const [editingReport, setEditingReport] =
        useState<MaintenanceReport | null>(null);
    const [viewingReport, setViewingReport] =
        useState<MaintenanceReport | null>(null);
    const [form] = Form.useForm();

    // Dynamic list fields
    const [tasksCompleted, setTasksCompleted] = useState<string[]>([""]);
    const [updatesPerformed, setUpdatesPerformed] = useState<string[]>([""]);
    const [issuesFound, setIssuesFound] = useState<string[]>([""]);
    const [issuesResolved, setIssuesResolved] = useState<string[]>([""]);

    // Autocomplete suggestions
    const [taskSuggestions, setTaskSuggestions] = useState<
        { value: string; label: string }[]
    >([]);
    const [updateSuggestions, setUpdateSuggestions] = useState<
        { value: string; label: string }[]
    >([]);
    const [issueFoundSuggestions, setIssueFoundSuggestions] = useState<
        { value: string; label: string }[]
    >([]);
    const [issueResolvedSuggestions, setIssueResolvedSuggestions] = useState<
        { value: string; label: string }[]
    >([]);

    // Import todos selection
    const [selectedTodoIds, setSelectedTodoIds] = useState<number[]>([]);

    // Fetch suggestions for autocomplete
    const fetchSuggestions = useCallback(
        async (search: string, field: string) => {
            try {
                const response = await fetch(
                    `/api/maintenance-reports/suggestions?q=${encodeURIComponent(
                        search
                    )}&field=${field}`
                );
                if (response.ok) {
                    const data = await response.json();
                    return data.map((item: string) => ({
                        value: item,
                        label: item,
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch suggestions:", error);
            }
            return [];
        },
        []
    );

    const handleTaskSearch = async (search: string) => {
        const suggestions = await fetchSuggestions(search, "tasks_completed");
        setTaskSuggestions(suggestions);
    };

    const handleUpdateSearch = async (search: string) => {
        const suggestions = await fetchSuggestions(search, "updates_performed");
        setUpdateSuggestions(suggestions);
    };

    const handleIssueFoundSearch = async (search: string) => {
        const suggestions = await fetchSuggestions(search, "issues_found");
        setIssueFoundSuggestions(suggestions);
    };

    const handleIssueResolvedSearch = async (search: string) => {
        const suggestions = await fetchSuggestions(search, "issues_resolved");
        setIssueResolvedSuggestions(suggestions);
    };

    const handleAdd = () => {
        setEditingReport(null);
        setTasksCompleted([""]);
        setUpdatesPerformed([""]);
        setIssuesFound([""]);
        setIssuesResolved([""]);
        form.resetFields();
        form.setFieldsValue({
            report_date: dayjs(),
            type: "monthly",
        });
        setModalVisible(true);
    };

    const handleEdit = (report: MaintenanceReport) => {
        setEditingReport(report);
        setTasksCompleted(
            report.tasks_completed?.length ? report.tasks_completed : [""]
        );
        setUpdatesPerformed(
            report.updates_performed?.length ? report.updates_performed : [""]
        );
        setIssuesFound(
            report.issues_found?.length ? report.issues_found : [""]
        );
        setIssuesResolved(
            report.issues_resolved?.length ? report.issues_resolved : [""]
        );
        form.setFieldsValue({
            ...report,
            report_date: dayjs(report.report_date),
        });
        setModalVisible(true);
    };

    const handleView = (report: MaintenanceReport) => {
        setViewingReport(report);
        setViewModalVisible(true);
    };

    const handleDelete = (reportId: number) => {
        router.delete(
            route("maintenance-reports.destroy", [projectId, reportId]),
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success("Report deleted successfully");
                },
            }
        );
    };

    const handleDownloadPdf = (report: MaintenanceReport) => {
        window.location.href = route("maintenance-reports.pdf", [
            projectId,
            report.id,
        ]);
    };

    const handleSubmit = (values: any) => {
        const data = {
            ...values,
            report_date: values.report_date.format("YYYY-MM-DD"),
            tasks_completed: tasksCompleted.filter((t) => t.trim()),
            updates_performed: updatesPerformed.filter((u) => u.trim()),
            issues_found: issuesFound.filter((i) => i.trim()),
            issues_resolved: issuesResolved.filter((i) => i.trim()),
        };

        if (editingReport) {
            router.put(
                route("maintenance-reports.update", [
                    projectId,
                    editingReport.id,
                ]),
                data,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        message.success("Report updated successfully");
                        setModalVisible(false);
                        form.resetFields();
                    },
                }
            );
        } else {
            router.post(route("maintenance-reports.store", projectId), data, {
                preserveScroll: true,
                onSuccess: () => {
                    message.success("Report added successfully");
                    setModalVisible(false);
                    form.resetFields();
                },
            });
        }
    };

    // Import todos functionality
    const completedTodos = todos.filter((todo) => todo.status === "completed");

    const handleOpenImportTodos = () => {
        setSelectedTodoIds([]);
        setImportTodosModalVisible(true);
    };

    const handleImportTodos = () => {
        const selectedTodos = completedTodos.filter((todo) =>
            selectedTodoIds.includes(todo.id)
        );
        const todoTitles = selectedTodos.map((todo) => todo.title);

        // Add selected todo titles to tasks completed
        const existingTasks = tasksCompleted.filter((t) => t.trim());
        const newTasks =
            existingTasks.length > 0
                ? [...existingTasks, ...todoTitles]
                : todoTitles;

        setTasksCompleted(newTasks.length > 0 ? newTasks : [""]);
        setImportTodosModalVisible(false);
        message.success(`Imported ${todoTitles.length} todos as tasks`);
    };

    const formatTimeSpent = (minutes?: number) => {
        if (!minutes) return null;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
        return `${mins}m`;
    };

    const typeColors: Record<string, string> = {
        monthly: "blue",
        weekly: "green",
        "ad-hoc": "orange",
    };

    const columns = [
        {
            title: "Date",
            dataIndex: "report_date",
            key: "report_date",
            width: 120,
            render: (date: string) => dayjs(date).format("MMM D, YYYY"),
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            width: 100,
            render: (type: string) => (
                <Tag color={typeColors[type]}>
                    {type.replace("-", " ").toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Summary",
            dataIndex: "summary",
            key: "summary",
            ellipsis: true,
            render: (summary: string, record: MaintenanceReport) => (
                <a
                    onClick={() => handleView(record)}
                    style={{ cursor: "pointer" }}
                >
                    {summary}
                </a>
            ),
        },
        {
            title: "Author",
            dataIndex: "user",
            key: "user",
            width: 150,
            render: (user?: User) => user?.name || "Unknown",
        },
        {
            title: "Time",
            dataIndex: "time_spent_minutes",
            key: "time_spent_minutes",
            width: 80,
            render: (minutes?: number) => formatTimeSpent(minutes) || "-",
        },
        {
            title: "Actions",
            key: "actions",
            width: 130,
            render: (_: any, record: MaintenanceReport) => (
                <Space size="small">
                    <Button
                        type="text"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownloadPdf(record)}
                        title="Download PDF"
                    />
                    {canUpdate && (
                        <>
                            <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleEdit(record)}
                            />
                            <Popconfirm
                                title="Delete this report?"
                                onConfirm={() => handleDelete(record.id)}
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
                        </>
                    )}
                </Space>
            ),
        },
    ];

    // Dynamic list helpers
    const addTaskCompleted = () => setTasksCompleted([...tasksCompleted, ""]);
    const removeTaskCompleted = (index: number) => {
        const newTasks = [...tasksCompleted];
        newTasks.splice(index, 1);
        setTasksCompleted(newTasks.length ? newTasks : [""]);
    };
    const updateTaskCompleted = (index: number, value: string) => {
        const newTasks = [...tasksCompleted];
        newTasks[index] = value;
        setTasksCompleted(newTasks);
    };

    const addUpdate = () => setUpdatesPerformed([...updatesPerformed, ""]);
    const removeUpdate = (index: number) => {
        const newUpdates = [...updatesPerformed];
        newUpdates.splice(index, 1);
        setUpdatesPerformed(newUpdates.length ? newUpdates : [""]);
    };
    const updateUpdate = (index: number, value: string) => {
        const newUpdates = [...updatesPerformed];
        newUpdates[index] = value;
        setUpdatesPerformed(newUpdates);
    };

    const addIssueFound = () => setIssuesFound([...issuesFound, ""]);
    const removeIssueFound = (index: number) => {
        const newIssues = [...issuesFound];
        newIssues.splice(index, 1);
        setIssuesFound(newIssues.length ? newIssues : [""]);
    };
    const updateIssueFound = (index: number, value: string) => {
        const newIssues = [...issuesFound];
        newIssues[index] = value;
        setIssuesFound(newIssues);
    };

    const addIssueResolved = () => setIssuesResolved([...issuesResolved, ""]);
    const removeIssueResolved = (index: number) => {
        const newIssues = [...issuesResolved];
        newIssues.splice(index, 1);
        setIssuesResolved(newIssues.length ? newIssues : [""]);
    };
    const updateIssueResolved = (index: number, value: string) => {
        const newIssues = [...issuesResolved];
        newIssues[index] = value;
        setIssuesResolved(newIssues);
    };

    return (
        <div style={{ paddingTop: 16 }}>
            {canUpdate && (
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                    style={{ marginBottom: 16 }}
                >
                    Add Report
                </Button>
            )}

            {reports.length > 0 ? (
                <Table
                    columns={columns}
                    dataSource={reports}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    className="custom-table"
                />
            ) : (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No maintenance reports yet"
                >
                    {canUpdate && (
                        <Button type="primary" onClick={handleAdd}>
                            Create First Report
                        </Button>
                    )}
                </Empty>
            )}

            {/* Add/Edit Modal */}
            <Modal
                title={editingReport ? "Edit Report" : "Add Maintenance Report"}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                width={700}
                styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="report_date"
                                label="Report Date"
                                rules={[
                                    {
                                        required: true,
                                        message: "Date is required",
                                    },
                                ]}
                            >
                                <DatePicker style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="type"
                                label="Report Type"
                                rules={[
                                    {
                                        required: true,
                                        message: "Type is required",
                                    },
                                ]}
                            >
                                <Select>
                                    <Select.Option value="monthly">
                                        Monthly
                                    </Select.Option>
                                    <Select.Option value="weekly">
                                        Weekly
                                    </Select.Option>
                                    <Select.Option value="ad-hoc">
                                        Ad-hoc
                                    </Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="summary"
                        label="Summary"
                        rules={[
                            { required: true, message: "Summary is required" },
                        ]}
                    >
                        <TextArea
                            rows={3}
                            placeholder="Brief summary of maintenance work performed"
                        />
                    </Form.Item>

                    <Divider orientation="left" plain>
                        <CheckCircleOutlined /> Tasks Completed
                        {completedTodos.length > 0 && (
                            <Button
                                type="link"
                                size="small"
                                icon={<ImportOutlined />}
                                onClick={handleOpenImportTodos}
                                style={{ marginLeft: 8 }}
                            >
                                Import from Todos
                            </Button>
                        )}
                    </Divider>
                    {tasksCompleted.map((task, index) => (
                        <Space
                            key={index}
                            style={{ display: "flex", marginBottom: 8 }}
                            align="baseline"
                        >
                            <AutoComplete
                                value={task}
                                onChange={(value) =>
                                    updateTaskCompleted(index, value)
                                }
                                onSearch={handleTaskSearch}
                                options={taskSuggestions}
                                placeholder="e.g., Updated all plugins"
                                style={{ width: 500 }}
                            />
                            {tasksCompleted.length > 1 && (
                                <Button
                                    type="text"
                                    danger
                                    onClick={() => removeTaskCompleted(index)}
                                >
                                    Remove
                                </Button>
                            )}
                        </Space>
                    ))}
                    <Button
                        type="dashed"
                        onClick={addTaskCompleted}
                        block
                        style={{ marginBottom: 16 }}
                    >
                        + Add Task
                    </Button>

                    <Divider orientation="left" plain>
                        <ToolOutlined /> Updates Performed
                    </Divider>
                    {updatesPerformed.map((update, index) => (
                        <Space
                            key={index}
                            style={{ display: "flex", marginBottom: 8 }}
                            align="baseline"
                        >
                            <AutoComplete
                                value={update}
                                onChange={(value) => updateUpdate(index, value)}
                                onSearch={handleUpdateSearch}
                                options={updateSuggestions}
                                placeholder="e.g., Updated WordPress to 6.4.2"
                                style={{ width: 500 }}
                            />
                            {updatesPerformed.length > 1 && (
                                <Button
                                    type="text"
                                    danger
                                    onClick={() => removeUpdate(index)}
                                >
                                    Remove
                                </Button>
                            )}
                        </Space>
                    ))}
                    <Button
                        type="dashed"
                        onClick={addUpdate}
                        block
                        style={{ marginBottom: 16 }}
                    >
                        + Add Update
                    </Button>

                    <Divider orientation="left" plain>
                        <WarningOutlined /> Issues Found
                    </Divider>
                    {issuesFound.map((issue, index) => (
                        <Space
                            key={index}
                            style={{ display: "flex", marginBottom: 8 }}
                            align="baseline"
                        >
                            <AutoComplete
                                value={issue}
                                onChange={(value) =>
                                    updateIssueFound(index, value)
                                }
                                onSearch={handleIssueFoundSearch}
                                options={issueFoundSuggestions}
                                placeholder="Describe issue found"
                                style={{ width: 500 }}
                            />
                            {issuesFound.length > 1 && (
                                <Button
                                    type="text"
                                    danger
                                    onClick={() => removeIssueFound(index)}
                                >
                                    Remove
                                </Button>
                            )}
                        </Space>
                    ))}
                    <Button
                        type="dashed"
                        onClick={addIssueFound}
                        block
                        style={{ marginBottom: 16 }}
                    >
                        + Add Issue Found
                    </Button>

                    <Divider orientation="left" plain>
                        <CheckCircleOutlined style={{ color: "green" }} />{" "}
                        Issues Resolved
                    </Divider>
                    {issuesResolved.map((issue, index) => (
                        <Space
                            key={index}
                            style={{ display: "flex", marginBottom: 8 }}
                            align="baseline"
                        >
                            <AutoComplete
                                value={issue}
                                onChange={(value) =>
                                    updateIssueResolved(index, value)
                                }
                                onSearch={handleIssueResolvedSearch}
                                options={issueResolvedSuggestions}
                                placeholder="Describe issue resolved"
                                style={{ width: 500 }}
                            />
                            {issuesResolved.length > 1 && (
                                <Button
                                    type="text"
                                    danger
                                    onClick={() => removeIssueResolved(index)}
                                >
                                    Remove
                                </Button>
                            )}
                        </Space>
                    ))}
                    <Button
                        type="dashed"
                        onClick={addIssueResolved}
                        block
                        style={{ marginBottom: 16 }}
                    >
                        + Add Issue Resolved
                    </Button>

                    <Form.Item name="notes" label="Additional Notes">
                        <TextArea
                            rows={3}
                            placeholder="Any additional notes or observations"
                        />
                    </Form.Item>

                    <Form.Item
                        name="time_spent_minutes"
                        label="Time Spent (minutes)"
                    >
                        <InputNumber
                            min={0}
                            max={1440}
                            style={{ width: 150 }}
                            placeholder="e.g., 60"
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Import Todos Modal */}
            <Modal
                title="Import Completed Todos"
                open={importTodosModalVisible}
                onCancel={() => setImportTodosModalVisible(false)}
                onOk={handleImportTodos}
                okText="Import Selected"
                okButtonProps={{ disabled: selectedTodoIds.length === 0 }}
            >
                {completedTodos.length > 0 ? (
                    <>
                        <Text
                            type="secondary"
                            style={{ marginBottom: 16, display: "block" }}
                        >
                            Select completed todos to add as tasks in the
                            report:
                        </Text>
                        <Checkbox.Group
                            value={selectedTodoIds}
                            onChange={(values) =>
                                setSelectedTodoIds(values as number[])
                            }
                            style={{ width: "100%" }}
                        >
                            <Space
                                direction="vertical"
                                style={{ width: "100%" }}
                            >
                                {completedTodos.map((todo) => (
                                    <Checkbox key={todo.id} value={todo.id}>
                                        <span>{todo.title}</span>
                                        {todo.completed_at && (
                                            <Text
                                                type="secondary"
                                                style={{
                                                    marginLeft: 8,
                                                    fontSize: 12,
                                                }}
                                            >
                                                (completed{" "}
                                                {dayjs(
                                                    todo.completed_at
                                                ).format("MMM D, YYYY")}
                                                )
                                            </Text>
                                        )}
                                    </Checkbox>
                                ))}
                            </Space>
                        </Checkbox.Group>
                        <div style={{ marginTop: 16 }}>
                            <Button
                                size="small"
                                onClick={() =>
                                    setSelectedTodoIds(
                                        completedTodos.map((t) => t.id)
                                    )
                                }
                            >
                                Select All
                            </Button>
                            <Button
                                size="small"
                                onClick={() => setSelectedTodoIds([])}
                                style={{ marginLeft: 8 }}
                            >
                                Clear
                            </Button>
                        </div>
                    </>
                ) : (
                    <Empty description="No completed todos to import" />
                )}
            </Modal>

            {/* View Modal */}
            <Modal
                title={
                    <Space>
                        <FileTextOutlined />
                        <span>
                            Maintenance Report -{" "}
                            {viewingReport &&
                                dayjs(viewingReport.report_date).format(
                                    "MMMM D, YYYY"
                                )}
                        </span>
                    </Space>
                }
                open={viewModalVisible}
                onCancel={() => setViewModalVisible(false)}
                footer={[
                    <Button
                        key="download"
                        icon={<DownloadOutlined />}
                        onClick={() =>
                            viewingReport && handleDownloadPdf(viewingReport)
                        }
                    >
                        Download PDF
                    </Button>,
                    <Button
                        key="close"
                        onClick={() => setViewModalVisible(false)}
                    >
                        Close
                    </Button>,
                    canUpdate && viewingReport && (
                        <Button
                            key="edit"
                            type="primary"
                            onClick={() => {
                                setViewModalVisible(false);
                                handleEdit(viewingReport);
                            }}
                        >
                            Edit Report
                        </Button>
                    ),
                ]}
                width={700}
            >
                {viewingReport && (
                    <div>
                        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                            <Col span={8}>
                                <Text type="secondary">Type</Text>
                                <div>
                                    <Tag color={typeColors[viewingReport.type]}>
                                        {viewingReport.type
                                            .replace("-", " ")
                                            .toUpperCase()}
                                    </Tag>
                                </div>
                            </Col>
                            <Col span={8}>
                                <Text type="secondary">Author</Text>
                                <div>
                                    <UserOutlined />{" "}
                                    {viewingReport.user?.name || "Unknown"}
                                </div>
                            </Col>
                            <Col span={8}>
                                <Text type="secondary">Time Spent</Text>
                                <div>
                                    <ClockCircleOutlined />{" "}
                                    {formatTimeSpent(
                                        viewingReport.time_spent_minutes
                                    ) || "Not tracked"}
                                </div>
                            </Col>
                        </Row>

                        <Card size="small" style={{ marginBottom: 16 }}>
                            <Text strong>Summary</Text>
                            <Paragraph
                                style={{ marginTop: 8, marginBottom: 0 }}
                            >
                                {viewingReport.summary}
                            </Paragraph>
                        </Card>

                        {viewingReport.tasks_completed &&
                            viewingReport.tasks_completed.length > 0 && (
                                <Card size="small" style={{ marginBottom: 16 }}>
                                    <Text strong>
                                        <CheckCircleOutlined
                                            style={{
                                                color: "green",
                                                marginRight: 8,
                                            }}
                                        />
                                        Tasks Completed
                                    </Text>
                                    <List
                                        size="small"
                                        dataSource={
                                            viewingReport.tasks_completed
                                        }
                                        renderItem={(item) => (
                                            <List.Item
                                                style={{ padding: "4px 0" }}
                                            >
                                                • {item}
                                            </List.Item>
                                        )}
                                    />
                                </Card>
                            )}

                        {viewingReport.updates_performed &&
                            viewingReport.updates_performed.length > 0 && (
                                <Card size="small" style={{ marginBottom: 16 }}>
                                    <Text strong>
                                        <ToolOutlined
                                            style={{
                                                color: "blue",
                                                marginRight: 8,
                                            }}
                                        />
                                        Updates Performed
                                    </Text>
                                    <List
                                        size="small"
                                        dataSource={
                                            viewingReport.updates_performed
                                        }
                                        renderItem={(item) => (
                                            <List.Item
                                                style={{ padding: "4px 0" }}
                                            >
                                                • {item}
                                            </List.Item>
                                        )}
                                    />
                                </Card>
                            )}

                        {viewingReport.issues_found &&
                            viewingReport.issues_found.length > 0 && (
                                <Card size="small" style={{ marginBottom: 16 }}>
                                    <Text strong>
                                        <WarningOutlined
                                            style={{
                                                color: "orange",
                                                marginRight: 8,
                                            }}
                                        />
                                        Issues Found
                                    </Text>
                                    <List
                                        size="small"
                                        dataSource={viewingReport.issues_found}
                                        renderItem={(item) => (
                                            <List.Item
                                                style={{ padding: "4px 0" }}
                                            >
                                                • {item}
                                            </List.Item>
                                        )}
                                    />
                                </Card>
                            )}

                        {viewingReport.issues_resolved &&
                            viewingReport.issues_resolved.length > 0 && (
                                <Card size="small" style={{ marginBottom: 16 }}>
                                    <Text strong>
                                        <CheckCircleOutlined
                                            style={{
                                                color: "green",
                                                marginRight: 8,
                                            }}
                                        />
                                        Issues Resolved
                                    </Text>
                                    <List
                                        size="small"
                                        dataSource={
                                            viewingReport.issues_resolved
                                        }
                                        renderItem={(item) => (
                                            <List.Item
                                                style={{ padding: "4px 0" }}
                                            >
                                                • {item}
                                            </List.Item>
                                        )}
                                    />
                                </Card>
                            )}

                        {viewingReport.notes && (
                            <Card size="small">
                                <Text strong>Additional Notes</Text>
                                <Paragraph
                                    style={{
                                        marginTop: 8,
                                        marginBottom: 0,
                                        whiteSpace: "pre-wrap",
                                    }}
                                >
                                    {viewingReport.notes}
                                </Paragraph>
                            </Card>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

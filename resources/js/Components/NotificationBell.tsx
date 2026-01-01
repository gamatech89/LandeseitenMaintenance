import React, { useState, useEffect } from "react";
import {
    Badge,
    Dropdown,
    List,
    Button,
    Typography,
    Empty,
    Spin,
    Avatar,
    Tooltip,
} from "antd";
import {
    BellOutlined,
    CheckOutlined,
    ProjectOutlined,
    CheckSquareOutlined,
    SafetyOutlined,
    UserAddOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { router } from "@inertiajs/react";

const { Text, Title } = Typography;

interface Notification {
    id: string;
    type: string;
    data: {
        project_id?: number;
        project_name?: string;
        todo_id?: number;
        todo_title?: string;
        role?: string;
        message: string;
        old_status?: string;
        new_status?: string;
        status_type?: string;
    };
    read_at: string | null;
    created_at: string;
    time_ago: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/notifications");
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await axios.post(`/api/notifications/${id}/read`);
            setNotifications(
                notifications.map((n) =>
                    n.id === id
                        ? { ...n, read_at: new Date().toISOString() }
                        : n
                )
            );
            setUnreadCount(Math.max(0, unreadCount - 1));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axios.post("/api/notifications/read-all");
            setNotifications(
                notifications.map((n) => ({
                    ...n,
                    read_at: new Date().toISOString(),
                }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        handleMarkAsRead(notification.id);

        // Navigate to relevant page
        if (notification.data.project_id) {
            router.visit(`/projects/${notification.data.project_id}`);
            setOpen(false);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "ProjectAssignedNotification":
                return {
                    icon: <UserAddOutlined />,
                    gradient:
                        "linear-gradient(135deg, #6c1e9f 0%, #9b4dca 100%)",
                };
            case "ProjectStatusChangedNotification":
                return {
                    icon: <ProjectOutlined />,
                    gradient:
                        "linear-gradient(135deg, #1890ff 0%, #69c0ff 100%)",
                };
            case "TodoAssignedNotification":
            case "TodoAddedNotification":
                return {
                    icon: <CheckSquareOutlined />,
                    gradient:
                        "linear-gradient(135deg, #52c41a 0%, #95de64 100%)",
                };
            default:
                return {
                    icon: <SafetyOutlined />,
                    gradient:
                        "linear-gradient(135deg, #faad14 0%, #ffc53d 100%)",
                };
        }
    };

    const getNotificationTitle = (type: string) => {
        switch (type) {
            case "ProjectAssignedNotification":
                return "Project Assignment";
            case "ProjectStatusChangedNotification":
                return "Status Update";
            case "TodoAssignedNotification":
                return "Todo Assigned";
            case "TodoAddedNotification":
                return "New Todo";
            default:
                return "Notification";
        }
    };

    const dropdownContent = (
        <div
            style={{
                width: 400,
                maxHeight: 500,
                overflow: "hidden",
                backgroundColor: "#ffffff",
                borderRadius: 16,
                boxShadow:
                    "0 20px 60px rgba(108, 30, 159, 0.15), 0 8px 25px rgba(0,0,0,0.08)",
                border: "1px solid rgba(108, 30, 159, 0.08)",
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: "20px 24px 16px",
                    background:
                        "linear-gradient(135deg, #6c1e9f 0%, #9b4dca 100%)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "rgba(255,255,255,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <BellOutlined style={{ fontSize: 18, color: "#fff" }} />
                    </div>
                    <div>
                        <Title
                            level={5}
                            style={{ margin: 0, color: "#fff", fontSize: 16 }}
                        >
                            Notifications
                        </Title>
                        <Text
                            style={{
                                color: "rgba(255,255,255,0.8)",
                                fontSize: 12,
                            }}
                        >
                            {unreadCount > 0
                                ? `${unreadCount} unread`
                                : "All caught up!"}
                        </Text>
                    </div>
                </div>
                {unreadCount > 0 && (
                    <Tooltip title="Mark all as read">
                        <Button
                            type="text"
                            size="small"
                            onClick={handleMarkAllAsRead}
                            icon={<CheckOutlined />}
                            style={{
                                color: "#fff",
                                background: "rgba(255,255,255,0.15)",
                                borderRadius: 8,
                                border: "none",
                                height: 32,
                                padding: "0 12px",
                            }}
                        >
                            Clear all
                        </Button>
                    </Tooltip>
                )}
            </div>

            {/* Content */}
            <div style={{ maxHeight: 400, overflow: "auto" }}>
                {loading && notifications.length === 0 ? (
                    <div style={{ padding: 60, textAlign: "center" }}>
                        <Spin size="large" />
                        <Text
                            type="secondary"
                            style={{ display: "block", marginTop: 16 }}
                        >
                            Loading notifications...
                        </Text>
                    </div>
                ) : notifications.length === 0 ? (
                    <div style={{ padding: "50px 20px", textAlign: "center" }}>
                        <div
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: "50%",
                                background:
                                    "linear-gradient(135deg, #f0f5ff 0%, #e6f4ff 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 20px",
                            }}
                        >
                            <BellOutlined
                                style={{
                                    fontSize: 32,
                                    color: "#6c1e9f",
                                    opacity: 0.5,
                                }}
                            />
                        </div>
                        <Title
                            level={5}
                            style={{ margin: "0 0 8px", color: "#1f1f1f" }}
                        >
                            No notifications yet
                        </Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            We'll notify you when something important happens
                        </Text>
                    </div>
                ) : (
                    <List
                        dataSource={notifications}
                        renderItem={(notification, index) => {
                            const iconData = getNotificationIcon(
                                notification.type
                            );
                            return (
                                <List.Item
                                    onClick={() =>
                                        handleNotificationClick(notification)
                                    }
                                    style={{
                                        padding: "16px 20px",
                                        cursor: "pointer",
                                        backgroundColor: notification.read_at
                                            ? "#ffffff"
                                            : "rgba(108, 30, 159, 0.03)",
                                        borderBottom:
                                            index < notifications.length - 1
                                                ? "1px solid rgba(0,0,0,0.04)"
                                                : "none",
                                        transition: "all 0.2s ease",
                                        margin: 0,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                            "rgba(108, 30, 159, 0.06)";
                                        e.currentTarget.style.transform =
                                            "translateX(4px)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                            notification.read_at
                                                ? "#ffffff"
                                                : "rgba(108, 30, 159, 0.03)";
                                        e.currentTarget.style.transform =
                                            "translateX(0)";
                                    }}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <div
                                                style={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 12,
                                                    background:
                                                        iconData.gradient,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: 18,
                                                    color: "#fff",
                                                    boxShadow:
                                                        "0 4px 12px rgba(0,0,0,0.1)",
                                                }}
                                            >
                                                {iconData.icon}
                                            </div>
                                        }
                                        title={
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                <Text
                                                    strong={
                                                        !notification.read_at
                                                    }
                                                    style={{
                                                        fontSize: 14,
                                                        color: notification.read_at
                                                            ? "#595959"
                                                            : "#1f1f1f",
                                                    }}
                                                >
                                                    {notification.data.message}
                                                </Text>
                                                {!notification.read_at && (
                                                    <span
                                                        style={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: "50%",
                                                            background:
                                                                "linear-gradient(135deg, #6c1e9f 0%, #e46a28 100%)",
                                                            display:
                                                                "inline-block",
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        }
                                        description={
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                    marginTop: 4,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        color: "#6c1e9f",
                                                        background:
                                                            "rgba(108, 30, 159, 0.08)",
                                                        padding: "2px 8px",
                                                        borderRadius: 4,
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {getNotificationTitle(
                                                        notification.type
                                                    )}
                                                </span>
                                                <Text
                                                    type="secondary"
                                                    style={{ fontSize: 12 }}
                                                >
                                                    {notification.time_ago}
                                                </Text>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            );
                        }}
                    />
                )}
            </div>
        </div>
    );

    return (
        <Dropdown
            dropdownRender={() => dropdownContent}
            trigger={["click"]}
            placement="bottomRight"
            open={open}
            onOpenChange={setOpen}
        >
            <Badge
                count={unreadCount}
                size="small"
                offset={[-4, 4]}
                style={{
                    background:
                        "linear-gradient(135deg, #e46a28 0%, #ff8c4a 100%)",
                    boxShadow: "0 2px 8px rgba(228, 106, 40, 0.4)",
                }}
            >
                <Tooltip title="Notifications">
                    <Button
                        type="text"
                        icon={<BellOutlined style={{ fontSize: 20 }} />}
                        style={{
                            width: 44,
                            height: 44,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 12,
                            background: open
                                ? "rgba(108, 30, 159, 0.1)"
                                : "transparent",
                            color: open ? "#6c1e9f" : "#595959",
                            transition: "all 0.2s ease",
                        }}
                        className="notification-bell-btn"
                    />
                </Tooltip>
            </Badge>
        </Dropdown>
    );
}

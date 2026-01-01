import React, { PropsWithChildren, useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    Layout,
    Menu,
    Avatar,
    Dropdown,
    Button,
    Space,
    Typography,
    Tooltip,
    Drawer,
    Grid,
    theme as antTheme,
} from "antd";
import {
    DashboardOutlined,
    FolderOutlined,
    LockOutlined,
    TeamOutlined,
    UserOutlined,
    LogoutOutlined,
    BulbOutlined,
    BulbFilled,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    MenuOutlined,
    CloseOutlined,
    SearchOutlined,
    HistoryOutlined,
    AppstoreOutlined,
} from "@ant-design/icons";
import { useTheme } from "@/Contexts/ThemeContext";
import { PageProps, User } from "@/types";
import GlobalSearch from "@/Components/GlobalSearch";
import NotificationBell from "@/Components/NotificationBell";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

interface AuthenticatedLayoutProps extends PropsWithChildren {
    header?: React.ReactNode;
}

export default function AuthenticatedLayout({
    header,
    children,
}: AuthenticatedLayoutProps) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const [collapsed, setCollapsed] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { token } = antTheme.useToken();
    const screens = useBreakpoint();

    // Determine if we're on mobile (smaller than md breakpoint)
    const isMobile = !screens.md;

    // Close mobile drawer when screen becomes larger
    useEffect(() => {
        if (!isMobile && mobileDrawerOpen) {
            setMobileDrawerOpen(false);
        }
    }, [isMobile, mobileDrawerOpen]);

    // Get the active menu key based on the current route
    const getActiveKey = () => {
        const currentRoute = route().current();
        if (currentRoute?.startsWith("dashboard")) return "dashboard";
        if (currentRoute?.startsWith("projects")) return "projects";
        if (currentRoute?.startsWith("vault")) return "vault";
        if (currentRoute?.startsWith("activity")) return "activity";
        if (currentRoute?.startsWith("team")) return "team";
        return "dashboard";
    };

    const menuItems = [
        {
            key: "dashboard",
            icon: <DashboardOutlined />,
            label: <Link href={route("dashboard")}>Dashboard</Link>,
        },
        {
            key: "projects",
            icon: <FolderOutlined />,
            label: <Link href={route("projects.index")}>Projects</Link>,
        },
        {
            key: "vault",
            icon: <LockOutlined />,
            label: <Link href={route("vault.index")}>Vault</Link>,
        },
        {
            key: "activity",
            icon: <HistoryOutlined />,
            label: <Link href={route("activity.index")}>Activity Log</Link>,
        },
    ];

    // Add Team Management for Admins and Managers
    if (user.role === "admin" || user.role === "manager") {
        menuItems.push({
            key: "team",
            icon: <TeamOutlined />,
            label: <Link href={route("team.index")}>Team</Link>,
        });
    }

    const userMenuItems = [
        {
            key: "profile",
            icon: <UserOutlined />,
            label: <Link href={route("profile.edit")}>Profile</Link>,
        },
        {
            type: "divider" as const,
        },
        {
            key: "logout",
            icon: <LogoutOutlined />,
            label: (
                <Link href={route("logout")} method="post" as="button">
                    Logout
                </Link>
            ),
        },
    ];

    // Sidebar content (shared between desktop Sider and mobile Drawer)
    const SidebarContent = () => (
        <>
            {/* Logo Section */}
            <div
                className="sidebar-logo"
                style={{
                    padding: collapsed && !isMobile ? "24px 12px" : "24px 20px",
                }}
            >
                <div className="sidebar-logo-icon">
                    <AppstoreOutlined
                        style={{ fontSize: 20, color: "white" }}
                    />
                </div>
                {(!collapsed || isMobile) && (
                    <div style={{ overflow: "hidden" }}>
                        <div
                            style={{
                                color: "white",
                                fontSize: "18px",
                                fontWeight: 700,
                                letterSpacing: "-0.5px",
                                lineHeight: 1.2,
                            }}
                        >
                            Landeseiten
                        </div>
                        <div
                            style={{
                                color: "rgba(255,255,255,0.5)",
                                fontSize: "12px",
                                fontWeight: 400,
                            }}
                        >
                            Project Manager
                        </div>
                    </div>
                )}
            </div>

            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[getActiveKey()]}
                items={menuItems}
                style={{ borderRight: 0, marginTop: 8 }}
                onClick={() => {
                    if (isMobile) {
                        setMobileDrawerOpen(false);
                    }
                }}
            />

            {/* User info at bottom of sidebar */}
            {(!collapsed || isMobile) && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: "16px 20px",
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(0,0,0,0.2)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        <Avatar
                            size={36}
                            style={{
                                background:
                                    "linear-gradient(135deg, #6c1e9f 0%, #e46a28 100%)",
                                fontWeight: 600,
                            }}
                        >
                            {user.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <div style={{ overflow: "hidden", flex: 1 }}>
                            <div
                                style={{
                                    color: "white",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {user.name}
                            </div>
                            <div
                                style={{
                                    color: "rgba(255,255,255,0.5)",
                                    fontSize: "12px",
                                    textTransform: "capitalize",
                                }}
                            >
                                {user.role}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <Layout style={{ minHeight: "100vh" }}>
            {/* Desktop Sidebar */}
            {!isMobile && (
                <Sider
                    trigger={null}
                    collapsible
                    collapsed={collapsed}
                    width={260}
                    collapsedWidth={80}
                    style={{
                        overflow: "auto",
                        height: "100vh",
                        position: "fixed",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        zIndex: 101,
                    }}
                >
                    <SidebarContent />
                </Sider>
            )}

            {/* Mobile Drawer */}
            <Drawer
                placement="left"
                open={mobileDrawerOpen}
                onClose={() => setMobileDrawerOpen(false)}
                width={280}
                styles={{
                    body: { padding: 0, background: "#001529" },
                    header: { display: "none" },
                }}
                style={{ zIndex: 1001 }}
            >
                <div style={{ position: "relative", height: "100%" }}>
                    <Button
                        type="text"
                        icon={<CloseOutlined style={{ color: "white" }} />}
                        onClick={() => setMobileDrawerOpen(false)}
                        style={{
                            position: "absolute",
                            top: 16,
                            right: 16,
                            zIndex: 10,
                        }}
                    />
                    <SidebarContent />
                </div>
            </Drawer>

            <Layout
                style={{
                    marginLeft: isMobile ? 0 : collapsed ? 80 : 260,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    background: theme === "dark" ? "#0f172a" : "#f8fafc",
                }}
            >
                <Header
                    style={{
                        padding: isMobile ? "0 12px" : "0 24px",
                        background:
                            theme === "dark"
                                ? "rgba(30, 41, 59, 0.85)"
                                : "rgba(255, 255, 255, 0.85)",
                        backdropFilter: "blur(12px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        position: "sticky",
                        top: 0,
                        zIndex: 100,
                        borderBottom: `1px solid ${
                            theme === "dark" ? "#334155" : "#e2e8f0"
                        }`,
                        height: 64,
                    }}
                >
                    <Space size={isMobile ? "small" : "middle"}>
                        {isMobile ? (
                            <Button
                                type="text"
                                icon={<MenuOutlined />}
                                onClick={() => setMobileDrawerOpen(true)}
                                style={{
                                    fontSize: "18px",
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                }}
                            />
                        ) : (
                            <Tooltip
                                title={
                                    collapsed
                                        ? "Expand sidebar"
                                        : "Collapse sidebar"
                                }
                            >
                                <Button
                                    type="text"
                                    icon={
                                        collapsed ? (
                                            <MenuUnfoldOutlined />
                                        ) : (
                                            <MenuFoldOutlined />
                                        )
                                    }
                                    onClick={() => setCollapsed(!collapsed)}
                                    style={{
                                        fontSize: "18px",
                                        width: 40,
                                        height: 40,
                                        borderRadius: 10,
                                    }}
                                />
                            </Tooltip>
                        )}
                        {header && (
                            <h1
                                style={{
                                    margin: 0,
                                    fontSize: isMobile ? "16px" : "20px",
                                    fontWeight: 600,
                                    color:
                                        theme === "dark"
                                            ? "#f1f5f9"
                                            : "#1e293b",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    maxWidth: isMobile ? "150px" : "auto",
                                }}
                            >
                                {header}
                            </h1>
                        )}
                    </Space>
                    <Space size={isMobile ? 4 : "middle"}>
                        <Tooltip title="Search (⌘K)">
                            <Button
                                type="text"
                                icon={<SearchOutlined />}
                                onClick={() => setSearchOpen(true)}
                                style={{
                                    fontSize: "18px",
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                }}
                            />
                        </Tooltip>
                        <NotificationBell />
                        <Tooltip
                            title={
                                theme === "dark" ? "Light mode" : "Dark mode"
                            }
                        >
                            <Button
                                type="text"
                                icon={
                                    theme === "dark" ? (
                                        <BulbFilled
                                            style={{ color: "#fbbf24" }}
                                        />
                                    ) : (
                                        <BulbOutlined />
                                    )
                                }
                                onClick={toggleTheme}
                                style={{
                                    fontSize: "18px",
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                }}
                            />
                        </Tooltip>
                        {!isMobile && (
                            <Dropdown
                                menu={{ items: userMenuItems }}
                                placement="bottomRight"
                                trigger={["click"]}
                            >
                                <Button
                                    type="text"
                                    style={{
                                        height: 40,
                                        padding: "4px 12px",
                                        borderRadius: 10,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    <Avatar
                                        size={28}
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #6c1e9f 0%, #e46a28 100%)",
                                            fontWeight: 600,
                                            fontSize: 12,
                                        }}
                                    >
                                        {user.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <span
                                        style={{
                                            fontWeight: 500,
                                            color:
                                                theme === "dark"
                                                    ? "#f1f5f9"
                                                    : "#1e293b",
                                        }}
                                    >
                                        {user.name}
                                    </span>
                                </Button>
                            </Dropdown>
                        )}
                        {isMobile && (
                            <Dropdown
                                menu={{ items: userMenuItems }}
                                placement="bottomRight"
                                trigger={["click"]}
                            >
                                <Avatar
                                    size={32}
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #6c1e9f 0%, #e46a28 100%)",
                                        fontWeight: 600,
                                        fontSize: 12,
                                        cursor: "pointer",
                                    }}
                                >
                                    {user.name.charAt(0).toUpperCase()}
                                </Avatar>
                            </Dropdown>
                        )}
                    </Space>
                </Header>
                <Content
                    style={{
                        margin: isMobile ? "12px" : "24px",
                        minHeight: 280,
                    }}
                >
                    <div className="animate-fade-in-up">{children}</div>
                </Content>
            </Layout>
            <GlobalSearch
                open={searchOpen}
                onClose={() => setSearchOpen(false)}
            />
        </Layout>
    );
}

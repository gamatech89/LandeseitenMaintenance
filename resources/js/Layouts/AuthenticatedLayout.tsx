import React, { PropsWithChildren, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    Layout,
    Menu,
    Avatar,
    Dropdown,
    Button,
    Space,
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
} from "@ant-design/icons";
import { useTheme } from "@/Contexts/ThemeContext";
import { PageProps, User } from "@/types";

const { Header, Sider, Content } = Layout;

interface AuthenticatedLayoutProps extends PropsWithChildren {
    header?: string;
}

export default function AuthenticatedLayout({
    header,
    children,
}: AuthenticatedLayoutProps) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const [collapsed, setCollapsed] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { token } = antTheme.useToken();

    // Get the active menu key based on the current route
    const getActiveKey = () => {
        const currentRoute = route().current();
        if (currentRoute?.startsWith("dashboard")) return "dashboard";
        if (currentRoute?.startsWith("projects")) return "projects";
        if (currentRoute?.startsWith("vault")) return "vault";
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
    ];

    // Add Team Management for Admins
    if (user.role === "admin") {
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

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                style={{
                    overflow: "auto",
                    height: "100vh",
                    position: "fixed",
                    left: 0,
                    top: 0,
                    bottom: 0,
                }}
            >
                <div
                    style={{
                        height: "64px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: collapsed ? "16px" : "18px",
                        fontWeight: "bold",
                        transition: "all 0.2s",
                    }}
                >
                    {collapsed ? "LSM" : "LSM Manager"}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[getActiveKey()]}
                    items={menuItems}
                />
            </Sider>
            <Layout
                style={{
                    marginLeft: collapsed ? 80 : 200,
                    transition: "all 0.2s",
                }}
            >
                <Header
                    style={{
                        padding: "0 24px",
                        background: token.colorBgContainer,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                        boxShadow: "0 1px 4px rgba(0,21,41,.08)",
                    }}
                >
                    <Space>
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
                                fontSize: "16px",
                                width: 64,
                                height: 64,
                            }}
                        />
                        {header && (
                            <h1 style={{ margin: 0, fontSize: "20px" }}>
                                {header}
                            </h1>
                        )}
                    </Space>
                    <Space size="large">
                        <Button
                            type="text"
                            icon={
                                theme === "dark" ? (
                                    <BulbFilled />
                                ) : (
                                    <BulbOutlined />
                                )
                            }
                            onClick={toggleTheme}
                            style={{ fontSize: "18px" }}
                        />
                        <Dropdown
                            menu={{ items: userMenuItems }}
                            placement="bottomRight"
                        >
                            <Space style={{ cursor: "pointer" }}>
                                <Avatar style={{ backgroundColor: "#1890ff" }}>
                                    {user.name.charAt(0).toUpperCase()}
                                </Avatar>
                                <span>{user.name}</span>
                            </Space>
                        </Dropdown>
                    </Space>
                </Header>
                <Content style={{ margin: "24px", minHeight: 280 }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}

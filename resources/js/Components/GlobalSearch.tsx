import { useState, useEffect, useCallback, useRef } from "react";
import { router } from "@inertiajs/react";
import { Modal, Input, List, Tag, Typography, Space, Spin, Empty } from "antd";
import {
    SearchOutlined,
    FolderOutlined,
    LockOutlined,
    CheckSquareOutlined,
    UserOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { debounce } from "lodash";

const { Text } = Typography;

interface SearchResult {
    type: "project" | "credential" | "todo" | "user";
    id: number;
    title: string;
    subtitle?: string;
    url: string;
}

interface GlobalSearchProps {
    open: boolean;
    onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<any>(null);

    // Focus input when modal opens
    useEffect(() => {
        if (open) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        } else {
            setQuery("");
            setResults([]);
        }
    }, [open]);

    // Keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                if (!open) {
                    // Parent component handles opening
                }
            }
            if (e.key === "Escape" && open) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    const performSearch = useCallback(
        debounce(async (searchQuery: string) => {
            if (!searchQuery.trim()) {
                setResults([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await axios.get("/api/search", {
                    params: { q: searchQuery },
                });
                setResults(response.data.results || []);
            } catch (error) {
                console.error("Search error:", error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300),
        []
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setLoading(true);
        performSearch(value);
    };

    const handleSelect = (result: SearchResult) => {
        onClose();
        router.visit(result.url);
    };

    const getIcon = (type: SearchResult["type"]) => {
        switch (type) {
            case "project":
                return <FolderOutlined style={{ color: "#6c1e9f" }} />;
            case "credential":
                return <LockOutlined style={{ color: "#52c41a" }} />;
            case "todo":
                return <CheckSquareOutlined style={{ color: "#1890ff" }} />;
            case "user":
                return <UserOutlined style={{ color: "#faad14" }} />;
            default:
                return <SearchOutlined />;
        }
    };

    const getTypeColor = (type: SearchResult["type"]) => {
        switch (type) {
            case "project":
                return "purple";
            case "credential":
                return "green";
            case "todo":
                return "blue";
            case "user":
                return "gold";
            default:
                return "default";
        }
    };

    return (
        <Modal
            title={null}
            open={open}
            onCancel={onClose}
            footer={null}
            width={600}
            styles={{
                body: { padding: 0 },
            }}
            closable={false}
        >
            <div style={{ padding: "16px 16px 0" }}>
                <Input
                    ref={inputRef}
                    placeholder="Search projects, credentials, todos..."
                    prefix={<SearchOutlined />}
                    suffix={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            ESC to close
                        </Text>
                    }
                    size="large"
                    value={query}
                    onChange={handleInputChange}
                    autoFocus
                />
            </div>

            <div
                style={{
                    maxHeight: 400,
                    overflowY: "auto",
                    padding: "8px 0",
                }}
            >
                {loading ? (
                    <div style={{ textAlign: "center", padding: 24 }}>
                        <Spin />
                    </div>
                ) : results.length > 0 ? (
                    <List
                        dataSource={results}
                        renderItem={(item) => (
                            <List.Item
                                style={{
                                    cursor: "pointer",
                                    padding: "12px 16px",
                                }}
                                onClick={() => handleSelect(item)}
                                className="search-result-item"
                            >
                                <Space>
                                    {getIcon(item.type)}
                                    <div>
                                        <div>
                                            <Text strong>{item.title}</Text>
                                            <Tag
                                                color={getTypeColor(item.type)}
                                                style={{ marginLeft: 8 }}
                                            >
                                                {item.type}
                                            </Tag>
                                        </div>
                                        {item.subtitle && (
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: 12 }}
                                            >
                                                {item.subtitle}
                                            </Text>
                                        )}
                                    </div>
                                </Space>
                            </List.Item>
                        )}
                    />
                ) : query ? (
                    <Empty
                        description="No results found"
                        style={{ padding: 24 }}
                    />
                ) : (
                    <div
                        style={{
                            textAlign: "center",
                            padding: 24,
                            color: "#999",
                        }}
                    >
                        <Text type="secondary">Start typing to search...</Text>
                    </div>
                )}
            </div>

            <style>{`
                .search-result-item:hover {
                    background: rgba(108, 30, 159, 0.1);
                }
            `}</style>
        </Modal>
    );
}

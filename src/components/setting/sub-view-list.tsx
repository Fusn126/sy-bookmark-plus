import { Component, For, Show, createMemo, createSignal } from "solid-js";
import { subViews, saveSubViews, groups } from "@/model/stores";
import { confirmDialog } from "@/libs/dialog";
import { showMessage } from "siyuan";
import { inputDialog } from "@frostime/siyuan-plugin-kits";
import { GroupIcon } from "./group-icon";


const SubViewList: Component = () => {
    const [editingView, setEditingView] = createSignal<string | null>(null);
    const [draggingGroup, setDraggingGroup] = createSignal<string | null>(null);

    const viewList = createMemo(() => {
        let views = Object.values(subViews());
        return views;
    });

    const createNewView = () => {
        inputDialog({
            title: "创建新的书签视图",
            defaultText: "",
            type: "textline",
            confirm: async (text: string) => {
                text = text.trim();
                if (!text) {
                    showMessage("请输入视图名称");
                    return;
                }
                //@ts-ignore
                const viewId = window.Lute.NewNodeID();
                const newView: IBookmarkSubView = {
                    id: viewId,
                    name: text,
                    groups: [],
                    expand: {},
                    hidden: false,
                    dockPosition: 'RightBottom',
                    icon: {
                        type: 'symbol',
                        value: 'iconEmoji'
                    }
                }
                subViews.update((views) => ({ ...views, [viewId]: newView }));
                saveSubViews();
            }
        });
    };

    const deleteView = async (viewId: string) => {
        await confirmDialog({
            title: "删除书签视图",
            content: "确定要删除该视图吗？",
            confirm: async () => {
                subViews.update(viewId, undefined!);
                await saveSubViews();
            }
        });
    };

    const toggleViewVisibility = async (viewId: string) => {
        const view = subViews()[viewId];
        if (!view) return;
        subViews.update(viewId, 'hidden', !view.hidden);
        await saveSubViews();
    };

    const toggleGroupInView = async (viewId: string, groupId: string) => {
        let view = subViews()[viewId];
        if (!view) return;

        subViews.update(viewId, 'groups', (groups: IBookmarkGroup['id'][]) => {
            if (groups.includes(groupId)) {
                return groups.filter(id => id !== groupId);
            } else {
                return [...groups, groupId];
            }
        });
        await saveSubViews();
    };

    const handleDragStart = (groupId: string, e: DragEvent) => {
        setDraggingGroup(groupId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (viewId: string, targetGroupId: string, e: DragEvent) => {
        e.preventDefault();
        const sourceGroupId = draggingGroup();
        if (!sourceGroupId) return;

        const view = subViews()[viewId];
        if (!view) return;

        subViews.update(viewId, 'groups', (groups: IBookmarkGroup['id'][]) => {
            const srcIdx = groups.indexOf(sourceGroupId);
            const targetIdx = groups.indexOf(targetGroupId);
            if (srcIdx === -1 || targetIdx === -1) return groups;
            let newGroups = structuredClone(groups);
            newGroups.splice(srcIdx, 1);
            newGroups.splice(targetIdx, 0, sourceGroupId);
            return newGroups;
        });

        await saveSubViews();
        setDraggingGroup(null);
    };

    const viewGroups = () => {
        const viewId = editingView();
        if (!viewId) return;
        const view = subViews()[viewId];
        if (!view) return;
        let inViews: IBookmarkGroup[] = [];
        let notInView: IBookmarkGroup[] = [];

        for (const group of groups) {
            const gid = group.id;
            if (view.groups.includes(gid)) {
                inViews.push(group);
            } else {
                notInView.push(group);
            }
        }

        // sort inViews as view groups order
        inViews.sort((a, b) => view.groups.indexOf(a.id) - view.groups.indexOf(b.id));

        return {
            inViews,
            notInView
        }
    }

    return (
        <div style={{
            display: "flex",
            "flex-direction": "column",
            gap: "16px",
            padding: "16px",
            "font-size": "14px"
        }}>
            <div style={{
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
                "margin-bottom": "16px"
            }}>
                <span style={{ "font-weight": "600" }}>书签子视图列表</span>
                <div
                    onClick={createNewView}
                    style={{
                        cursor: "pointer",
                        padding: "4px 8px",
                        "border-radius": "4px",
                        background: "var(--b3-theme-background-light)",
                        display: "flex",
                        "align-items": "center",
                        gap: "4px"
                    }}
                >
                    <svg style={{ width: "14px", height: "14px", fill: 'currentcolor' }}><use href="#iconAdd"></use></svg>
                    <span>新建视图</span>
                </div>
            </div>

            <For each={viewList()}>
                {(view) => (
                    <div style={{
                        padding: "16px",
                        background: "var(--b3-theme-surface)",
                        "border-radius": "6px",
                        "margin-bottom": "8px",
                        border: "1px solid var(--b3-theme-surface-lighter)"
                    }}>
                        <div style={{
                            display: "flex",
                            "align-items": "center",
                            "justify-content": "space-between",
                            "margin-bottom": editingView() === view.id ? "16px" : "0"
                        }}>
                            <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                                <span style={{ "font-weight": "500" }}>{view.name}</span>
                                <div
                                    onClick={() => toggleViewVisibility(view.id)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <svg style={{ width: "16px", height: "16px" }}>
                                        <use href={view.hidden ? "#iconEyeoff" : "#iconEye"}></use>
                                    </svg>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <div
                                    onClick={() => setEditingView(view.id === editingView() ? null : view.id)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <svg style={{ width: "16px", height: "16px" }}>
                                        <use href="#iconEdit"></use>
                                    </svg>
                                </div>
                                <div
                                    onClick={() => deleteView(view.id)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <svg style={{ width: "16px", height: "16px" }}>
                                        <use href="#iconTrashcan"></use>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <Show when={editingView() === view.id}>
                            <div style={{
                                display: "flex",
                                "flex-direction": "column",
                                gap: "6px",
                                "margin-top": "16px",
                                "padding-top": "16px",
                                "border-top": "1px solid var(--b3-theme-surface-lighter)"
                            }}>
                                <div style={{ "font-weight": "500" }}>当前视图包含的书签组</div>
                                <For each={viewGroups().inViews}>
                                    {(group) => (
                                        <div
                                            style={{
                                                display: "flex",
                                                "align-items": "center",
                                                padding: "8px",
                                                // background: "var(--b3-theme-background)",
                                                "border-radius": "4px",
                                                'border': '1px solid var(--b3-border-color)',
                                                cursor: "move",
                                                gap: "4px"
                                            }}
                                            draggable={true}
                                            onDragStart={(e) => handleDragStart(group.id, e)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(view.id, group.id, e)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={true}
                                                onChange={() => toggleGroupInView(view.id, group.id)}
                                                style={{ margin: "0 8px 0 0" }}
                                            />
                                            <GroupIcon group={group} />
                                            <span>{group.name}</span>
                                        </div>
                                    )}
                                </For>
                                <div style={{ "font-weight": "500" }}>其他书签组</div>
                                <For each={viewGroups().notInView}>
                                    {(group) => (
                                        <div style={{
                                            display: "flex",
                                            "align-items": "center",
                                            padding: "8px",
                                            "border-radius": "4px",
                                            'border': '1px solid var(--b3-border-color)',
                                            gap: "4px"
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={false}
                                                onChange={() => toggleGroupInView(view.id, group.id)}
                                                style={{ margin: "0 8px 0 0" }}
                                            />
                                            <GroupIcon group={group} />
                                            <span>{group.name}</span>
                                        </div>
                                    )}
                                </For>
                            </div>
                        </Show>
                    </div>
                )}
            </For>
        </div>
    );
};

export default SubViewList;
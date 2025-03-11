import { Component, For, Show, createMemo, createSignal } from "solid-js";
import { subViews, saveSubViews, groups } from "@/model/stores";
import { confirmDialog } from "@/libs/dialog";
import { showMessage } from "siyuan";
import { inputDialog } from "@frostime/siyuan-plugin-kits";
import { GroupIcon } from "../elements/group-icon";
import Icon from "../elements/icon";
import { selectGroupIcon } from "../elements/select-icon";
import { SelectInput } from "@/libs/components/Elements";
import { destroyBookmark } from "@/dock-views";
import { i18n } from "@/utils/i18n";


const SubViewList: Component = () => {
    const [editingView, setEditingView] = createSignal<string | null>(null);
    const [draggingGroup, setDraggingGroup] = createSignal<string | null>(null);

    const viewList = createMemo(() => {
        let views = Object.values(subViews());
        return views;
    });

    const createNewView = () => {
        inputDialog({
            title: i18n.src_components_setting_subviewlisttsx.create_bookmark_view,
            defaultText: "",
            type: "textline",
            confirm: async (text: string) => {
                text = text.trim();
                if (!text) {
                    showMessage(i18n.src_components_setting_subviewlisttsx.enter_view_name);
                    return;
                }
                //@ts-ignore
                const viewId = window.Lute.NewNodeID();
                const newView: IBookmarkSubView = {
                    id: viewId,
                    name: text,
                    groups: [],
                    expand: {},
                    hidden: true,
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
            title: i18n.src_components_setting_subviewlisttsx.delete_bookmark_view,
            content: i18n.src_components_setting_subviewlisttsx.confirm_delete_view,
            confirm: async () => {
                if (editingView() === viewId) {
                    setEditingView(null);
                }
                destroyBookmark(viewId, {
                    deleteDockElement: true,
                    // hideIcon: true,
                    deleteIcon: true
                });
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

    const BookmarkGroupItem: Component<{
        group: IBookmarkGroup;
        checked: boolean;
        draggable?: boolean;
        onToggle: () => void;
        onDragStart?: (e: DragEvent) => void;
        onDragOver?: (e: DragEvent) => void;
        onDrop?: (e: DragEvent) => void;
    }> = (props) => {
        return (
            <div
                style={{
                    display: "flex",
                    "align-items": "center",
                    padding: "8px",
                    "border-radius": "4px",
                    'border': '1px solid var(--b3-border-color)',
                    cursor: props.draggable ? "move" : "default",
                    gap: "4px"
                }}
                draggable={props.draggable}
                onDragStart={props.onDragStart}
                onDragOver={props.onDragOver}
                onDrop={props.onDrop}
            >
                <input
                    type="checkbox"
                    checked={props.checked}
                    onChange={props.onToggle}
                    style={{ margin: "0 8px 0 0" }}
                />
                <GroupIcon group={props.group} />
                <span>{props.group.name}</span>
            </div>
        );
    };

    return (
        <div
            class="fn__flex fn__flex-1 bookmark-config-group-list"
            style={{
                display: "flex",
                "flex-direction": "column",
                gap: "10px",
                padding: "16px",
                "font-size": "14px"
            }}
        >
            <div style={{
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
                "margin-bottom": "8px",
            }}>
                <span style={{ "font-weight": "600" }}>{i18n.src_components_setting_subviewlisttsx.bookmark_subview}</span>
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
                    <span>{i18n.src_components_setting_subviewlisttsx.new_view}</span>
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
                                <span style={{ display: 'contents', cursor: 'pointer' }} onClick={(e: MouseEvent) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    selectGroupIcon({
                                        show: 'symbols',
                                        onReset: () => {},
                                        onUpdate: (icon) => {
                                            subViews.update(view.id, 'icon', icon);
                                        }
                                    })
                                }}>
                                    <Icon symbol={view.icon.value} />
                                </span>
                                <span style={{ "font-weight": "500" }}
                                    onClick={(e: MouseEvent) => {
                                        e.preventDefault();
                                        inputDialog({
                                            title: '修改视图名称',
                                            defaultText: view.name,
                                            confirm: (value: string) => {
                                                subViews.update(view.id, 'name', value);
                                            }
                                        })
                                    }}
                                >
                                    {view.name}
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: "12px", "align-items": "center" }}>
                                <SelectInput
                                    value={view.dockPosition ?? "RightBottom"}
                                    options={{
                                        "LeftTop": i18n.src_components_setting_subviewlisttsx.top_left,
                                        "LeftBottom": i18n.src_components_setting_subviewlisttsx.bottom_left,
                                        "RightTop": i18n.src_components_setting_subviewlisttsx.top_right,
                                        "RightBottom": i18n.src_components_setting_subviewlisttsx.bottom_right
                                    }}
                                    changed={(value: "RightTop" | "RightBottom" | "LeftTop" | "LeftBottom") => {
                                        subViews.update(view.id, 'dockPosition', value);
                                    }}
                                />
                                <div
                                    onClick={() => toggleViewVisibility(view.id)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <svg style={{ width: "16px", height: "16px" }}>
                                        <use href={view.hidden ? "#iconEyeoff" : "#iconEye"}></use>
                                    </svg>
                                </div>
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
                                <div style={{ "font-weight": "500" }}>{i18n.src_components_setting_subviewlisttsx.current_view_bookmarks}</div>
                                <For each={viewGroups().inViews}>
                                    {(group) => (
                                        <BookmarkGroupItem
                                            group={group}
                                            checked={true}
                                            draggable={true}
                                            onToggle={() => toggleGroupInView(view.id, group.id)}
                                            onDragStart={(e) => handleDragStart(group.id, e)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(view.id, group.id, e)}
                                        />
                                    )}
                                </For>
                                <div style={{ "font-weight": "500" }}>{i18n.src_components_setting_subviewlisttsx.other_bookmark_groups}</div>
                                <For each={viewGroups().notInView}>
                                    {(group) => (
                                        <BookmarkGroupItem
                                            group={group}
                                            checked={false}
                                            onToggle={() => toggleGroupInView(view.id, group.id)}
                                        />
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
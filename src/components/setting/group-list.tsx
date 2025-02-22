import { createMemo, For } from "solid-js";
import { groups, setGroups, itemInfo, getModel } from "../../model";
import { moveItem } from "../../libs/op";
import { GroupIcon } from "../elements/group-icon";
import { selectGroupIcon } from "../elements/select-icon";
import { confirm, showMessage } from "siyuan";
import inputDialog from '@/libs/components/input-dialog';
import { i18n } from "@/utils/i18n";
import Icon from "../elements/icon";
import { CheckboxInput } from "@/libs/components/Elements";
import { createNewGroup } from "../new-group";

const App = () => {

    const model = getModel();
    const i18n_ = i18n.group;

    let Counts = createMemo(() => {
        let Cnt: { [key: string]: { indexed: number, closed: number, deleted: number } } = {};
        groups.forEach((group: IBookmarkGroup) => {
            let itemClosed = group.items.filter((it) => itemInfo[it.id]?.err === 'BoxClosed');
            let itemDelete = group.items.filter((it) => itemInfo[it.id]?.err === 'BlockDeleted');
            Cnt[group.id] = {
                closed: itemClosed.length,
                deleted: itemDelete.length,
                indexed: group.items.length - itemClosed.length - itemDelete.length
            }
        })
        return Cnt;
    })

    const onDragover = (e: DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        let srcGroupIdx: string = e.dataTransfer.getData("text/plain");
        e.dataTransfer.clearData();
        let target = (e.target as HTMLElement).closest(".bookmark-group") as HTMLElement;
        if (!target) return;
        let targetGroupIndex: string = target.dataset.index;
        let from = Number.parseInt(srcGroupIdx);
        let to = Number.parseInt(targetGroupIndex);
        if (from === to) return;

        setGroups((groups) => moveItem(groups, from, to));
    };

    const groupAdd = () => {
        createNewGroup((result: { group: {name: string, type?: TBookmarkGroupType }, rule: any, icon?: IBookmarkGroup['icon'] }) => {
            // console.log(result);
            let { group, rule, icon } = result;
            if (group.name === "") {
                showMessage(i18n.msg.groupNameEmpty, 3000, 'error');
                return;
            }
            model.newGroup(group.name, group.type, rule, icon, true);
        });
    };

    return (
        <section
            class="fn__flex fn__flex-1 bookmark-config-group-list"
            style={{
                padding: '20px 10px',
                gap: '10px',
                display: 'flex',
                flex: 1,
                'flex-direction': 'column'
            }}
        >

            <div style={{
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
                "margin-bottom": "8px",
                padding: '0px 8px'
            }}>
                <span style={{ "font-weight": "600" }}>
                    {i18n.setting.grouplist.title}
                </span>
                <div
                    onClick={(e) => { e.stopPropagation(); groupAdd() }}
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
                    <span>{i18n.bookmark.logo.add}</span>
                </div>
            </div>

            <For each={groups}>
                {(group, i) => (
                    <li
                        class="bookmark-group b3-list-item"
                        style={{
                            gap: '12px',
                            height: '40px',
                            padding: '5px 10px',
                            "border-radius": "6px",
                            background: "var(--b3-theme-surface)",
                            border: "1px solid var(--b3-theme-surface-lighter)",
                            display: "flex",
                            "align-items": "center"
                        }}
                        data-index={i()}
                        data-group-id={group.id}
                        draggable="true"
                        onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", `${i()}`);
                        }}
                        onDragOver={onDragover}
                        onDrop={onDrop}
                    >
                        {/* <svg class="b3-list-item__graphic">
                            <GroupIcon group={group}/>
                        </svg> */}
                        <span style={{ display: 'contents' }} onClick={(e: MouseEvent) => {
                            e.stopPropagation();
                            e.preventDefault();
                            selectGroupIcon({
                                show: 'all',
                                onReset: () => {
                                    model.setGroups(group.id, 'icon', null);
                                },
                                onUpdate: (icon) => {
                                    model.setGroups(group.id, 'icon', icon);
                                }
                            })
                        }}>
                            <GroupIcon group={group} />
                        </span>

                        <span class="b3-list-item__text ariaLabel" data-position="parentE">
                            {group.name}
                        </span>
                        <span class="fn__space" />
                        <span class="counter ariaLabel" aria-label="Indexed" style={{ margin: 0, "background-color": "var(--b3-card-success-background)" }}>
                            {Counts()[group.id].indexed}
                        </span>
                        <span class="counter ariaLabel" aria-label="Box Closed" style={{ margin: 0, "background-color": "var(--b3-card-warning-background)" }}>
                            {Counts()[group.id].closed}
                        </span>
                        <span class="counter ariaLabel" aria-label="Not Found" style={{ margin: 0, "background-color": "var(--b3-card-error-background)" }}>
                            {Counts()[group.id].deleted}
                        </span>
                        <span class="fn__space" />
                        {/* <div class="fn__flex fn__flex-center">
                            <input
                                class="b3-switch fn__flex-center"
                                checked={group.hidden === true ? false : true}
                                type="checkbox"
                                onChange={() => {
                                    setGroups((g) => g.id === group.id, 'hidden', (hidden) => !hidden);
                                }}
                            />
                        </div> */}
                        <span style={{ display: 'contents' }}>
                            <CheckboxInput
                                checked={group.hidden === true ? false : true}
                                changed={() => {
                                    setGroups((g) => g.id === group.id, 'hidden', (hidden) => !hidden);
                                }}
                            />
                        </span>

                        <span
                            onClick={() => {
                                inputDialog({
                                    title: i18n_.rename,
                                    defaultText: group.name,
                                    width: "500px",
                                    type: 'textline',
                                    confirm: (title: string) => {
                                        if (title) {
                                            model.renameGroup(group.id, title.trim());
                                        }
                                    }
                                });
                            }}
                            style={{ cursor: "pointer", display: 'flex' }}
                        >
                            <Icon symbol="iconEdit" />
                        </span>

                        <span
                            onClick={() => {
                                confirm(
                                    i18n_.delete,
                                    `Remove "${group.name}"?`,
                                    () => {
                                        // model.removeGroup(group.id);
                                        model.delGroup(group.id);
                                    }
                                );
                            }}
                            style={{ cursor: "pointer", display: 'flex' }}
                        >
                            <Icon symbol="iconTrashcan" />
                        </span>
                    </li>
                )}
            </For>
        </section>
    );
};

export default App;

import { Component, For, Show, createMemo, createSignal } from "solid-js";
import { render } from "solid-js/web";
import Group from "./group";
import { confirm, Menu, Plugin, showMessage } from "siyuan";
import { configs, getModel, groups, subViews } from "../model";
import { confirmDialog } from "@/libs/dialog";

import { BookmarkContext } from "./context";

import NewGroup from "./new-group";

import { i18n, renderI18n } from "@/utils/i18n";


const createNewGroup = (confirmCb: (data: any) => void) => {
    let container = document.createElement("div") as HTMLDivElement;
    container.style.display = 'contents';

    const [group, setGroup] = createSignal({ name: "", type: "normal" });
    const [rule, setRule] = createSignal({ type: "", input: "" });
    const [icon, setIcon] = createSignal<IBookmarkGroup['icon'] | null>(null);

    render(() => NewGroup({
        setGroup: (args) => {
            let current = group();
            let newval = { ...current, ...args };
            setGroup(newval);
        },
        setRule: (args) => {
            let current = rule();
            let newval = { ...current, ...args };
            setRule(newval);
        },
        icon,
        setIcon
    }), container);
    confirmDialog({
        title: i18n.bookmark.new,
        content: container,
        width: '800px',
        confirm: () => {
            confirmCb({ group: group(), rule: rule(), icon: icon() });
        }
    });
}


/**
 * Bookmark 组件
 * @param props
 * @param props.plugin
 * @param model
 * @param props.sourceView: 来源, 默认的书签组或者是自定义的书签组视图
 */
const BookmarkComponent: Component<{
    plugin: Plugin;
    // model: BookmarkDataModel;
    sourceView: 'DEFAULT' | string;
}> = (props) => {

    const I18N = i18n.bookmark;

    const model = getModel();

    const [fnRotate, setFnRotate] = createSignal("");

    type TAction = "" | "AllExpand" | "AllCollapse";
    const [doAction, setDoAction] = createSignal<TAction>("");

    const shownGroups = createMemo(() => {
        if (props.sourceView === "DEFAULT") {
            return groups.filter(group => !group.hidden);
        } else {
            const view = subViews()[props.sourceView];
            if (!view) return [];
            let ans = [];
            for (const gid of view.groups) {
                const g = groups.find(g => g.id === gid);
                if (g) ans.push(g);
            }
            return ans;
        }
    });

    const groupAdd = () => {
        createNewGroup((result: { group: any, rule: any, icon?: IBookmarkGroup['icon'] }) => {
            // console.log(result);
            let { group, rule, icon } = result;
            if (group.name === "") {
                showMessage(i18n.msg.groupNameEmpty, 3000, 'error');
                return;
            }
            model.newGroup(group.name, group.type, rule, icon);
        });
    };

    const bookmarkRefresh = () => {
        setFnRotate("fn__rotate");
        model.updateViews(props.sourceView).then(() => {
            setTimeout(() => {
                setFnRotate("");
            }, 500);
        });
    };

    const groupDelete = (detail: IBookmarkGroup) => {
        confirm(
            // `是否删除书签组${detail.name}[${detail.id}]?`,
            renderI18n(i18n.bookmark.delete.title, detail.name, detail.id),
            i18n.bookmark.delete.desc,
            // "⚠️ 删除后无法恢复！确定删除吗？",
            () => {
                model.delGroup(detail.id)
            }
        );
    };

    const groupMove = (
        detail: {
            to: "up" | "down" | "top" | "bottom";
            group: IBookmarkGroup;
        }
    ) => {
        const srcIdx = groups.findIndex(
            (g: IBookmarkGroup) => g.id === detail.group.id
        );
        let targetIdx: number = -1;
        if (detail.to === "up") {
            for (let i = srcIdx - 1; i >= 0; i--) {
                if (!groups[i].hidden) {
                    targetIdx = i;
                    break;
                }
            }
        }
        else if (detail.to === "down") {
            for (let i = srcIdx + 1; i < groups.length; i++) {
                if (!groups[i].hidden) {
                    targetIdx = i;
                    break;
                }
            }
        }
        else if (detail.to === "top") targetIdx = 0;
        else if (detail.to === "bottom") targetIdx = groups.length - 1;
        else return;
        if (targetIdx < 0 || targetIdx >= groups.length) return;

        model.moveGroup(srcIdx, targetIdx);
    };

    const bookmarkContextMenu = (e: MouseEvent) => {
        if (props.sourceView !== 'DEFAULT') return;
        const menu = new Menu();
        menu.addItem({
            label: i18n.bookmark.cache,
            icon: "iconDownload",
            click: () => {
                const time = new Date();
                const timeStr = `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()} ${time.getHours()}_${time.getMinutes()}_${time.getSeconds()}`;
                const name = `Cache/bookmarks-${timeStr}.json`;
                model.save(name);
                showMessage(`${name}`);
            },
        });
        menu.open({
            x: e.clientX,
            y: e.clientY,
        });
    };

    const viewIcon = () => {
        if (props.sourceView !== 'DEFAULT') {
            const icon = subViews()[props.sourceView]?.icon;
            if (icon?.type === 'symbol') {
                return icon.value;
            }
        }
        return 'iconBookmark';
    }

    const viewName = () => {
        return props.sourceView !== 'DEFAULT' ? subViews()[props.sourceView].name : I18N.logo.name;
    }

    const Bookmark = () => (
        <section id="custom-bookmark-container" style={{
            display: 'contents',
        }}>
            <div class="block__icons custom-bookmark-icons" onContextMenu={bookmarkContextMenu}
            >
                <div class="block__logo">
                    <svg class="block__logoicon">
                        <use href={`#${viewIcon()}`}></use>
                    </svg>
                    {viewName()}
                </div>
                <span class="fn__flex-1"></span>
                <Show when={props.sourceView === "DEFAULT"}>
                    <span
                        data-type="setting"
                        class="block__icon ariaLabel"
                        aria-label={I18N.logo.setting}
                        onClick={props.plugin.openSetting}
                    >
                        <svg class="">
                            <use href="#iconSettings"></use>
                        </svg>
                    </span>
                    <span class="fn__space"></span>
                    <span
                        data-type="add"
                        class="block__icon ariaLabel"
                        aria-label={I18N.logo.add}
                        onClick={groupAdd}
                    >
                        <svg class="">
                            <use href="#iconAdd"></use>
                        </svg>
                    </span>
                    <span class="fn__space"></span>
                </Show>
                <span
                    data-type="refresh"
                    class="block__icon ariaLabel"
                    aria-label={I18N.logo.refresh}
                    onClick={bookmarkRefresh}
                >
                    <svg class={fnRotate()}>
                        <use href="#iconRefresh"></use>
                    </svg>
                </span>
                <span class="fn__space"></span>
                <span
                    data-type="expand"
                    class="block__icon ariaLabel"
                    aria-label={I18N.logo.expand}
                    onClick={() => {
                        setDoAction('AllExpand');
                    }}
                >
                    <svg>
                        <use href="#iconExpand"></use>
                    </svg>
                </span>
                <span class="fn__space"></span>
                <span
                    data-type="collapse"
                    class="block__icon ariaLabel"
                    aria-label={I18N.logo.collapse}
                    onClick={() => {
                        setDoAction('AllCollapse');
                    }}
                >
                    <svg>
                        <use href="#iconContract"></use>
                    </svg>
                </span>
                <span class="fn__space"></span>
                <span
                    data-type="min"
                    class="block__icon ariaLabel"
                    aria-label={I18N.logo.min}
                >
                    <svg>
                        <use href="#iconMin"></use>
                    </svg>
                </span>
            </div>
            <main class="fn__flex-1 b3-list b3-list--background custom-bookmark-body"
                classList={{
                    'card-view': configs.viewMode === 'card'
                }}
            >
                <For each={shownGroups()}>
                    {(group) => (
                        <Group
                            group={group}
                            groupDelete={groupDelete}
                            groupMove={groupMove}
                        />
                    )}
                </For>
            </main>
        </section>
    );

    return (
        <BookmarkContext.Provider
            value={{
                plugin: props.plugin,
                model: model,
                subViewId: props.sourceView,
                shownGroups, doAction
            }}
        >
            <Bookmark />
        </BookmarkContext.Provider>
    );
};

export default BookmarkComponent;
